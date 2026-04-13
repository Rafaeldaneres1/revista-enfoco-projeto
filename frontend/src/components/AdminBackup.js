import React, { useState, useEffect } from 'react';
import { downloadBackup, getBackupHistory, cleanOldBackups, exportToCSV } from '../lib/backup';

const AdminBackup = () => {
  const [backupHistory, setBackupHistory] = useState([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [notification, setNotification] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadBackupHistory();
  }, []);

  const loadBackupHistory = () => {
    const history = getBackupHistory();
    setBackupHistory(history);
    if (history.length > 0) {
      setLastBackup(history[0]);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const result = await downloadBackup(token);
      if (result.success) {
        setNotification({ type: 'success', message: result.message });
        setTimeout(() => loadBackupHistory(), 1000);
      } else {
        setNotification({ type: 'error', message: result.message });
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExportCSV = async (dataType) => {
    try {
      const result = await exportToCSV(token, dataType);
      if (result.success) {
        setNotification({ type: 'success', message: result.message });
      } else {
        setNotification({ type: 'error', message: result.message });
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    }
  };

  const handleCleanOldBackups = () => {
    if (window.confirm('Remover backups com mais de 30 dias?')) {
      const result = cleanOldBackups(30);
      setNotification({
        type: 'success',
        message: `${result.removed} backups removidos. ${result.remaining} mantidos.`
      });
      setTimeout(() => loadBackupHistory(), 500);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-8">
      {/* Notification */}
      {notification && (
        <div className={`rounded-lg p-4 animate-slide-down flex items-start gap-3 ${
          notification.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <span className="text-lg mt-0.5">{notification.type === 'success' ? '✓' : '✗'}</span>
          <p className="text-sm font-medium flex-1">{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="text-lg hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Backup Completo */}
        <div className="enfoco-glass rounded-xl p-6 shadow-premium">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
              💾
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-charcoal">Backup Completo</h3>
              <p className="text-xs text-stone">Todos os dados da revista</p>
            </div>
          </div>

          {lastBackup && (
            <p className="text-xs text-stone mb-4">
              Último backup: {formatDate(lastBackup.timestamp)}
            </p>
          )}

          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:shadow-premium transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isBackingUp ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Fazendo backup...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Fazer Backup Agora
              </>
            )}
          </button>
        </div>

        {/* Exportar Dados */}
        <div className="enfoco-glass rounded-xl p-6 shadow-premium">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-charcoal">Exportar Dados</h3>
              <p className="text-xs text-stone">Em formato CSV</p>
            </div>
          </div>

          <div className="space-y-2">
            {['posts', 'columns', 'events', 'editions'].map(type => (
              <button
                key={type}
                onClick={() => handleExportCSV(type)}
                className="w-full px-4 py-2 rounded-lg border border-green-200 text-green-800 text-sm font-medium hover:bg-green-50 transition-colors"
              >
                Exportar {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Histórico de Backups */}
      <div className="enfoco-glass rounded-xl p-6 shadow-premium">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-bold text-charcoal">Histórico de Backups</h3>
          <button
            onClick={handleCleanOldBackups}
            className="text-xs text-red-600 hover:text-red-800 font-semibold"
          >
            Limpar Antigos
          </button>
        </div>

        {backupHistory.length > 0 ? (
          <div className="space-y-3">
            {backupHistory.map((backup, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-charcoal">{formatDate(backup.timestamp)}</p>
                  <p className="text-xs text-stone mt-1">
                    Tamanho: {formatFileSize(backup.size)}
                  </p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    backup.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {backup.status === 'success' ? '✓ Sucesso' : '✗ Erro'}
                  </span>
                </div>
                <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-stone">Nenhum backup realizado ainda</p>
          </div>
        )}
      </div>

      {/* Informações de Backup */}
      <div className="enfoco-glass rounded-xl p-6 shadow-premium">
        <h3 className="font-display text-lg font-bold text-charcoal mb-4">ℹ️ Informações sobre Backup</h3>
        <div className="space-y-3 text-sm text-stone">
          <p>
            <strong>O que é incluído:</strong> Notícias, colunas, eventos, edições, categorias, equipe e configurações.
          </p>
          <p>
            <strong>Frequência recomendada:</strong> Fazer backup diariamente ou após mudanças importantes.
          </p>
          <p>
            <strong>Armazenamento:</strong> Os backups são salvos em seu computador. Recomendamos também fazer upload para um serviço em nuvem como Google Drive ou Dropbox.
          </p>
          <p>
            <strong>Restauração:</strong> Em caso de perda de dados, você pode restaurar a partir de um backup anterior.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminBackup;

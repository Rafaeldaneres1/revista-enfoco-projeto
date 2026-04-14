/**
 * Backup Module - Sistema de Backup Automático
 * Exporta dados da revista para proteção e backup
 */

// Exportar todos os dados em JSON
export const exportAllData = async (token) => {
  try {
    const endpoints = [
      '/api/posts',
      '/api/columns',
      '/api/events',
      '/api/editions',
      '/api/categories',
      '/api/team',
      '/api/about'
    ];

    const data = {};
    const errors = [];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {  }
        });
        
        if (response.ok) {
          const key = endpoint.replace('/api/', '');
          data[key] = await response.json();
        } else {
          errors.push(`Erro ao buscar ${endpoint}`);
        }
      } catch (error) {
        errors.push(`Falha ao buscar ${endpoint}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return {
      success: false,
      data: null,
      errors: [error.message],
      timestamp: new Date().toISOString()
    };
  }
};

// Exportar dados como arquivo JSON
export const downloadBackup = async (token, filename = null) => {
  try {
    const backup = await exportAllData(token);
    
    if (!backup.success) {
      throw new Error('Falha ao criar backup');
    }

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `revista-enfoco-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'Backup baixado com sucesso',
      filename: link.download
    };
  } catch (error) {
    console.error('Erro ao baixar backup:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Importar dados de um backup
export const importBackup = async (file, token) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target.result);

        // Validar estrutura do backup
        if (!backup.data || !backup.timestamp) {
          reject(new Error('Arquivo de backup inválido'));
          return;
        }

        // Restaurar dados
        const results = {
          success: [],
          errors: []
        };

        for (const [key, items] of Object.entries(backup.data)) {
          try {
            // Aqui você poderia restaurar os dados via API
            // Por enquanto, apenas registramos
            results.success.push(`${key}: ${items.length} itens`);
          } catch (error) {
            results.errors.push(`Erro ao restaurar ${key}: ${error.message}`);
          }
        }

        resolve({
          success: results.errors.length === 0,
          results,
          backupDate: backup.timestamp
        });
      } catch (error) {
        reject(new Error(`Erro ao ler arquivo: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsText(file);
  });
};

// Agendar backup automático
export const scheduleAutoBackup = (token, intervalHours = 24) => {
  const interval = intervalHours * 60 * 60 * 1000;

  const performBackup = async () => {
    try {
      const backup = await exportAllData(token);
      
      if (backup.success) {
        // Salvar em localStorage (com limite de tamanho)
        const backups = JSON.parse(localStorage.getItem('revista_backups') || '[]');
        backups.push({
          timestamp: backup.timestamp,
          size: JSON.stringify(backup.data).length,
          status: 'success'
        });

        // Manter apenas os últimos 10 backups
        if (backups.length > 10) {
          backups.shift();
        }

        localStorage.setItem('revista_backups', JSON.stringify(backups));
        console.log('Backup automático realizado:', backup.timestamp);
      }
    } catch (error) {
      console.error('Erro no backup automático:', error);
    }
  };

  // Executar imediatamente
  performBackup();

  // Agendar para depois
  return setInterval(performBackup, interval);
};

// Obter histórico de backups
export const getBackupHistory = () => {
  try {
    const backups = JSON.parse(localStorage.getItem('revista_backups') || '[]');
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch {
    return [];
  }
};

// Limpar backups antigos
export const cleanOldBackups = (daysToKeep = 30) => {
  try {
    const backups = JSON.parse(localStorage.getItem('revista_backups') || '[]');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filtered = backups.filter(backup => {
      return new Date(backup.timestamp) > cutoffDate;
    });

    localStorage.setItem('revista_backups', JSON.stringify(filtered));
    
    return {
      removed: backups.length - filtered.length,
      remaining: filtered.length
    };
  } catch (error) {
    console.error('Erro ao limpar backups:', error);
    return { removed: 0, remaining: 0 };
  }
};

// Exportar dados em CSV
export const exportToCSV = async (token, dataType = 'posts') => {
  try {
    const response = await fetch(`/api/${dataType}`, {
      headers: {  }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar ${dataType}`);
    }

    const items = await response.json();

    if (!items || items.length === 0) {
      throw new Error('Nenhum dado para exportar');
    }

    // Preparar CSV
    const headers = Object.keys(items[0]);
    const csvContent = [
      headers.join(','),
      ...items.map(item =>
        headers.map(header => {
          const value = item[header];
          // Escapar aspas e envolver em aspas se contiver vírgula
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `revista-${dataType}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      message: `${items.length} itens exportados`,
      filename: link.download
    };
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

export default {
  exportAllData,
  downloadBackup,
  importBackup,
  scheduleAutoBackup,
  getBackupHistory,
  cleanOldBackups,
  exportToCSV
};


import React, { useState, useCallback } from 'react';

const AdminMediaLibrary = ({ onSelectImage, onClose }) => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState('all');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleImageUpload(file);
    }
  };

  const handleImageUpload = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now(),
          url: e.target.result,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date()
        };
        setImages([newImage, ...images]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectImage = (image) => {
    setSelectedImage(image);
    onSelectImage(image.url);
    onClose();
  };

  const handleDeleteImage = (imageId) => {
    setImages(images.filter(img => img.id !== imageId));
  };

  const filteredImages = images.filter(img => {
    if (filter === 'recent') return true;
    if (filter === 'large') return img.size > 1000000;
    if (filter === 'small') return img.size <= 1000000;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="font-display text-2xl font-bold text-charcoal">Biblioteca de Mídia</h2>
          <button
            onClick={onClose}
            className="text-charcoal/60 hover:text-charcoal text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-all ${
              dragActive
                ? 'border-royal-blue bg-royal-blue/5'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
          >
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-charcoal font-semibold mb-1">Arraste imagens aqui ou clique para selecionar</p>
            <p className="text-sm text-stone">PNG, JPG, GIF até 5MB</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="mt-4 inline-block px-4 py-2 bg-royal-blue text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-royal-blue/90 transition-colors">
              Selecionar Arquivo
            </label>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mb-6">
            {['all', 'recent', 'large', 'small'].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === filterType
                    ? 'bg-royal-blue text-white'
                    : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                }`}
              >
                {filterType === 'all' && 'Todas'}
                {filterType === 'recent' && 'Recentes'}
                {filterType === 'large' && 'Grandes'}
                {filterType === 'small' && 'Pequenas'}
              </button>
            ))}
          </div>

          {/* Grid de Imagens */}
          {filteredImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map(image => (
                <div
                  key={image.id}
                  className="group relative rounded-lg overflow-hidden bg-gray-100 aspect-square cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => handleSelectImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-600 text-white rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs truncate">
                    {image.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-stone">Nenhuma imagem na biblioteca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMediaLibrary;

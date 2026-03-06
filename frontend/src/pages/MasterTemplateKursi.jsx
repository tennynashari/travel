import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Pagination from '../components/Pagination';

function MasterTemplateKursi() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    rowsConfig: [2, 2, 2, 2, 2, 2], // Default: 6 rows x 2 seats
    isDefault: false,
    isActive: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/seat-templates');
      setTemplates(response.data.data);
    } catch (err) {
      setError(t('masterSeatTemplate.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditMode(true);
      setFormData({
        id: template.id,
        name: template.name,
        description: template.description || '',
        rowsConfig: template.rowsConfig,
        isDefault: template.isDefault,
        isActive: template.isActive
      });
    } else {
      setEditMode(false);
      setFormData({
        id: '',
        name: '',
        description: '',
        rowsConfig: [2, 2, 2, 2, 2, 2],
        isDefault: false,
        isActive: true
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        rowsConfig: formData.rowsConfig,
        isDefault: formData.isDefault,
        isActive: formData.isActive
      };

      if (editMode) {
        await api.put(`/seat-templates/${formData.id}`, data);
        setSuccess(t('masterSeatTemplate.updateSuccess'));
      } else {
        await api.post('/seat-templates', data);
        setSuccess(t('masterSeatTemplate.addSuccess'));
      }

      fetchTemplates();
      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || t('masterSeatTemplate.saveError'));
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(t('masterSeatTemplate.deleteConfirm', { name }))) {
      try {
        await api.delete(`/seat-templates/${id}`);
        setSuccess(t('masterSeatTemplate.deleteSuccess'));
        fetchTemplates();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || t('masterSeatTemplate.deleteError'));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const addRow = () => {
    setFormData({
      ...formData,
      rowsConfig: [...formData.rowsConfig, 2]
    });
  };

  const removeRow = (index) => {
    if (formData.rowsConfig.length > 1) {
      const newRows = formData.rowsConfig.filter((_, i) => i !== index);
      setFormData({ ...formData, rowsConfig: newRows });
    }
  };

  const updateRow = (index, value) => {
    const seats = parseInt(value);
    if (seats >= 1 && seats <= 6) {
      const newRows = [...formData.rowsConfig];
      newRows[index] = seats;
      setFormData({ ...formData, rowsConfig: newRows });
    }
  };

  const getTotalSeats = (rowsConfig) => {
    return rowsConfig.reduce((sum, seats) => sum + seats, 0);
  };

  const getSeatNumbers = (rowIndex, rowsConfig) => {
    let startSeat = 1;
    for (let i = 0; i < rowIndex; i++) {
      startSeat += rowsConfig[i];
    }
    return Array.from({ length: rowsConfig[rowIndex] }, (_, i) => startSeat + i);
  };

  const getPreviewGrid = (rowsConfig) => {
    return (
      <div className="space-y-2">
        {rowsConfig.map((seatsInRow, rowIndex) => {
          const seatNumbers = getSeatNumbers(rowIndex, rowsConfig);
          return (
            <div key={rowIndex} className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500 w-12 text-right">{t('masterSeatTemplate.rowLabel', { number: rowIndex + 1 })}:</span>
              <div className="flex gap-2">
                {seatNumbers.map((seatNum) => (
                  <div
                    key={seatNum}
                    className="w-10 h-10 bg-blue-100 border border-blue-300 rounded flex items-center justify-center text-xs font-medium text-blue-700"
                  >
                    {seatNum}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('masterSeatTemplate.title')}</h1>
          <p className="text-gray-600 mt-1">{t('masterSeatTemplate.subtitle')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('masterSeatTemplate.addTemplate')}
        </button>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}
      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">{t('common.loading')}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            {t('common.noData')}
          </div>
        ) : (
          templates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {template.name}
                      {template.isDefault && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          ⭐ {t('masterSeatTemplate.default')}
                        </span>
                      )}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-600">{template.description}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">{t('common.total')}: {template.totalSeats} {t('schedule.seats')}</div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {getPreviewGrid(template.rowsConfig)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{template.rowsConfig.length} {t('masterSeatTemplate.rows')}</span>
                  <span>{template._count?.vehicles || 0} {t('masterSeatTemplate.vehicles')}</span>
                  <span className={`px-2 py-1 rounded ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {template.isActive ? t('common.active') : t('common.inactive')}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(template)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                    disabled={template._count?.vehicles > 0}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && templates.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={templates.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">
                {editMode ? t('masterSeatTemplate.editTemplate') : '✨ ' + t('masterSeatTemplate.addTemplate')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('masterSeatTemplate.templateName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={t('masterSeatTemplate.enterName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('masterSeatTemplate.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={t('masterSeatTemplate.enterDescription')}
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    🪑 {t('masterSeatTemplate.rowConfiguration')}
                  </label>

                  <div className="space-y-2 mb-3">
                    {formData.rowsConfig.map((seats, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-16">Row {index + 1}:</span>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={seats}
                          onChange={(e) => updateRow(index, e.target.value)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <span className="text-sm text-gray-600">{t('masterSeatTemplate.seatsPerRow')}</span>
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          disabled={formData.rowsConfig.length === 1}
                          className="ml-auto px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('masterSeatTemplate.removeRow')}
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addRow}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-sm text-gray-600 hover:text-blue-700"
                  >
                    + {t('masterSeatTemplate.addRow')}
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    👁️ {t('masterSeatTemplate.preview')}:
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {getPreviewGrid(formData.rowsConfig)}
                  </div>
                  <div className="mt-2 text-center">
                    <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                      ✅ {t('common.total')}: {getTotalSeats(formData.rowsConfig)} {t('schedule.seats')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t('masterSeatTemplate.setAsDefault')}</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t('masterSeatTemplate.active')}</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editMode ? t('common.save') : t('masterSeatTemplate.addTemplate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterTemplateKursi;

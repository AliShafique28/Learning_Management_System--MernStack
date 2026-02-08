import { useState, useEffect } from 'react';
import { Award, Download, ExternalLink, Calendar } from 'lucide-react';
import { certificateAPI, getFileURL } from '../../api/endpoints';
import { handleAPIError, showSuccess } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await certificateAPI.getMyCertificates();
      setCertificates(response.data.data);
    } catch (error) {
      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId, courseName) => {
    try {
      const response = await certificateAPI.download(certificateId);
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${courseName}-certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('Certificate downloaded successfully!');
    } catch (error) {
      handleAPIError(error);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">My Certificates</h1>
        <p className="text-gray-600">Your earned certificates and achievements</p>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <div className="card text-center py-12">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No certificates yet</h3>
          <p className="text-gray-600 mb-4">
            Complete courses to earn certificates and showcase your achievements
          </p>
        </div>
      ) : (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
                  <p className="text-sm text-gray-600">Total Certificates</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {certificates.filter((c) => {
                      const date = new Date(c.issuedAt);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">This Month</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {certificates.filter((c) => new Date(c.issuedAt).getFullYear() === new Date().getFullYear()).length}
                  </p>
                  <p className="text-sm text-gray-600">This Year</p>
                </div>
              </div>
            </div>
          </div>

          {/* Certificates List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate._id}
                certificate={certificate}
                onDownload={handleDownload}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Certificate Card Component
const CertificateCard = ({ certificate, onDownload }) => {
  const course = certificate.course;

  return (
    <div className="card hover:shadow-lg transition-shadow">
      {/* Certificate Preview */}
      <div className="relative mb-4 bg-gradient-to-br from-primary-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="text-center">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h3 className="text-xl font-bold mb-1">Certificate of Completion</h3>
          <p className="text-sm opacity-90">This certifies that you have successfully completed</p>
        </div>
      </div>

      {/* Course Info */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Issued on {formatDate(certificate.issuedAt)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Certificate ID: {certificate.certificateId}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => onDownload(certificate._id, course.title)}
          className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        <a
          href={getFileURL(certificate.pdfUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          title="View Certificate"
        >
          <ExternalLink className="w-4 h-4 text-gray-600" />
        </a>
      </div>
    </div>
  );
};

export default MyCertificates;

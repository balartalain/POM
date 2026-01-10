
import React, { useRef } from 'react';
import { ActivityCompletion, ActivityStatus } from '../types';
import { CheckCircleIcon, ClockIcon, UploadIcon, DocumentCheckIcon } from './Icons';

interface ActivityItemProps {
  activityName: string;
  completion: ActivityCompletion;
  planDeadline: string;
  onComplete: (fileName: string) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activityName, completion, planDeadline, onComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPastDeadline = new Date() > new Date(planDeadline);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onComplete(file.name);
    } else {
      alert('Por favor, sube un archivo PDF válido.');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const renderStatus = () => {
    if (completion.status === ActivityStatus.COMPLETED) {
      return (
        <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                <CheckCircleIcon className="w-4 h-4"/> Completado
            </span>
            {completion.evidenceFile && (
                 <a
                    href={`data:text/html, <html><body style="font-family: sans-serif; padding: 2rem;"><h1>Viendo: ${completion.evidenceFile}</h1><p>Este es un marcador de posición para el visor de documentos real. En una aplicación real, esto abriría el archivo PDF.</p></body></html>`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-blue-600 hover:underline truncate hidden sm:inline-flex items-center group"
                    title={`Ver ${completion.evidenceFile}`}
                >
                    <DocumentCheckIcon className="w-4 h-4 inline mr-1 text-gray-500 group-hover:text-blue-600" />
                    {completion.evidenceFile}
                </a>
            )}
        </div>
      );
    }

    if (isPastDeadline) {
      return (
        <span className="flex items-center gap-1 text-sm font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
            <ClockIcon className="w-4 h-4"/> Vencido
        </span>
      );
    }

    return (
       <span className="flex items-center gap-1 text-sm font-semibold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">
            <ClockIcon className="w-4 h-4"/> Pendiente
       </span>
    );
  };
  
  const renderAction = () => {
      if (completion.status === ActivityStatus.PENDING && !isPastDeadline) {
          return (
             <>
                <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    onClick={handleUploadClick}
                    className="flex items-center gap-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-md transition-colors"
                >
                   <UploadIcon className="w-4 h-4" />
                   Subir PDF
                </button>
             </>
          );
      }
      return null;
  }

  return (
    <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg border">
      <p className="text-dark-gray mb-2 sm:mb-0 flex-1">{activityName}</p>
      <div className="flex items-center gap-4 w-full sm:w-auto">
        {renderStatus()}
        <div className="ml-auto sm:ml-0">
          {renderAction()}
        </div>
      </div>
    </li>
  );
};

export default ActivityItem;

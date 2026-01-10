
import React, { useRef } from 'react';
import { Activity, ActivityStatus } from '../types';
import { CheckCircleIcon, ClockIcon, UploadIcon, DocumentCheckIcon } from './Icons';

interface ActivityItemProps {
  activity: Activity;
  planDeadline: string;
  onComplete: (fileName: string) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, planDeadline, onComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPastDeadline = new Date() > new Date(planDeadline);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onComplete(file.name);
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const renderStatus = () => {
    if (activity.status === ActivityStatus.COMPLETED) {
      return (
        <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                <CheckCircleIcon className="w-4 h-4"/> Completed
            </span>
            <span className="text-sm text-gray-500 truncate hidden sm:inline" title={activity.evidenceFile}>
                <DocumentCheckIcon className="w-4 h-4 inline mr-1"/>
                {activity.evidenceFile}
            </span>
        </div>
      );
    }

    if (isPastDeadline) {
      return (
        <span className="flex items-center gap-1 text-sm font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
            <ClockIcon className="w-4 h-4"/> Overdue
        </span>
      );
    }

    return (
       <span className="flex items-center gap-1 text-sm font-semibold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">
            <ClockIcon className="w-4 h-4"/> Pending
       </span>
    );
  };
  
  const renderAction = () => {
      if (activity.status === ActivityStatus.PENDING && !isPastDeadline) {
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
                   Upload PDF
                </button>
             </>
          );
      }
      return null;
  }

  return (
    <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg border">
      <p className="text-dark-gray mb-2 sm:mb-0 flex-1">{activity.name}</p>
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

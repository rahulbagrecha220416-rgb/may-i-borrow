import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="rounded-xl shadow-sm overflow-hidden bg-[#F7F2EB] animate-pulse">
            {/* Image Placeholder */}
            <div className="w-full h-40 bg-gray-200 dark:bg-gray-700" />

            <div className="p-4 space-y-3">
                {/* Title Placeholder */}
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />

                {/* Date/Info Placeholder */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />

                {/* Buttons Placeholder */}
                <div className="flex gap-2 pt-2">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1" />
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;

import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="container mx-auto p-6 lg:pl-8 space-y-6">
      <div className="text-center text-red-500 p-4">
        <p>{message}</p>
      </div>
    </div>
  );
}

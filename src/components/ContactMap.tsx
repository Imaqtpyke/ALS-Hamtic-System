import React from 'react';

const ContactMap: React.FC = () => (
  <div style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
    <img
      src="/hamtic capitol.png"
      alt="Hamtic Capitol Map"
      style={{ width: '100%', height: 'auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
    />
    <p className="text-center text-gray-600 mt-2 text-sm">
      Location: Hamtic Capitol, Antique, Philippines
    </p>
  </div>
);

export default ContactMap; 
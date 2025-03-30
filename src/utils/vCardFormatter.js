/**
 * vCardFormatter.js
 * Utility for formatting contact data as vCard (VCF) format
 */

/**
 * Converts a contact object to vCard format (VCF)
 * @param {Object} contact - The contact object to convert
 * @returns {string} - vCard formatted string
 */
export const contactToVCard = (contact) => {
  if (!contact || !contact.name) {
    throw new Error('Invalid contact data');
  }

  // Start vCard
  let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';
  
  // Add name
  vCard += `FN:${contact.name}\n`;
  
  // Split name into parts (simple implementation)
  const nameParts = contact.name.split(' ');
  const lastName = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ');
  vCard += `N:${lastName};${firstName};;;\n`;
  
  // Add phone if available
  if (contact.phone) {
    vCard += `TEL;TYPE=CELL:${contact.phone}\n`;
  }
  
  // Add email if available
  if (contact.email) {
    vCard += `EMAIL;TYPE=INTERNET:${contact.email}\n`;
  }
  
  // Add address if available
  if (contact.address) {
    vCard += `ADR;TYPE=HOME:;;${contact.address};;;;\n`;
  }
  
  // Add photo if available
  if (contact.photoData && contact.photoData.data) {
    // Extract base64 data without the data URI prefix
    let photoData = contact.photoData.data;
    if (photoData.startsWith('data:')) {
      photoData = photoData.split(',')[1];
    }
    vCard += `PHOTO;ENCODING=b;TYPE=${contact.photoData.type || 'JPEG'}:${photoData}\n`;
  }
  
  // Add creation date if available
  if (contact.createdAt) {
    const formattedDate = new Date(contact.createdAt)
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0] + 'Z';
    vCard += `REV:${formattedDate}\n`;
  }
  
  // End vCard
  vCard += 'END:VCARD';
  
  return vCard;
};

/**
 * Creates a downloadable vCard file from contact data
 * @param {Object} contact - The contact object to convert
 * @returns {Blob} - Blob containing the vCard data
 */
export const createVCardFile = (contact) => {
  const vCardString = contactToVCard(contact);
  return new Blob([vCardString], { type: 'text/vcard' });
};

/**
 * Creates a File object from contact data for sharing
 * @param {Object} contact - The contact object to convert
 * @returns {File} - File object containing the vCard data
 */
export const createVCardFileForSharing = (contact) => {
  const vCardString = contactToVCard(contact);
  const fileName = `${contact.name.replace(/\s+/g, '_')}.vcf`;
  return new File([vCardString], fileName, { type: 'text/vcard' });
};
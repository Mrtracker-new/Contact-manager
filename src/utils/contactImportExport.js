import { getContacts, saveContact } from './contactsStorage';
import { contactToVCard } from './vCardFormatter';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import QRCode from 'qrcode';

// CSV Export
export const exportToCSV = async () => {
  try {
    const contacts = await getContacts();
    const headers = ['Name', 'Phone', 'Email', 'Address', 'Notes', 'Tags', 'Groups'];
    const csvContent = [
      headers.join(','),
      ...contacts.map(contact => [
        `"${contact.name}"`,
        `"${contact.phone || ''}"`,
        `"${contact.email || ''}"`,
        `"${(contact.address || '').replace(/"/g, '""')}"`,
        `"${(contact.notes || '').replace(/"/g, '""')}"`,
        `"${(contact.tags || []).join(';')}"`,
        `"${(contact.groups || []).join(';')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

// vCard Export
export const exportToVCard = async () => {
  try {
    const contacts = await getContacts();
    const vCardContent = contacts.map(contact => contactToVCard(contact)).join('\n');
    const blob = new Blob([vCardContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to vCard:', error);
    throw error;
  }
};

// PDF Export
export const exportToPDF = async () => {
  try {
    const contacts = await getContacts();
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let y = 10;

    contacts.forEach((contact, index) => {
      if (y > 280) {
        doc.addPage();
        y = 10;
      }

      doc.setFontSize(12);
      doc.text(`Contact ${index + 1}`, 10, y);
      y += 10;

      doc.setFontSize(10);
      doc.text(`Name: ${contact.name}`, 10, y);
      y += 7;
      doc.text(`Phone: ${contact.phone || 'N/A'}`, 10, y);
      y += 7;
      doc.text(`Email: ${contact.email || 'N/A'}`, 10, y);
      y += 7;
      doc.text(`Address: ${contact.address || 'N/A'}`, 10, y);
      y += 7;
      doc.text(`Notes: ${contact.notes || 'N/A'}`, 10, y);
      y += 7;
      doc.text(`Tags: ${(contact.tags || []).join(', ') || 'N/A'}`, 10, y);
      y += 7;
      doc.text(`Groups: ${(contact.groups || []).join(', ') || 'N/A'}`, 10, y);
      y += 15;
    });

    doc.save(`contacts_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

// QR Code Generation with data compression
export const generateQRCode = async (contact) => {
  try {
    // Create a minimal version of the contact for QR code
    const minimalContact = {
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      address: contact.address
    };

    // Convert to vCard format
    const vCardContent = contactToVCard(minimalContact);
    
    // Check if the data is too large for QR code
    if (vCardContent.length > 2000) {
      throw new Error('Contact data is too large for QR code. Please use vCard sharing instead.');
    }

    const qrDataUrl = await QRCode.toDataURL(vCardContent, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Share contact with fallback options
export const shareContact = async (contact) => {
  try {
    // Create vCard file
    const vCardContent = contactToVCard(contact);
    const fileName = `${contact.name.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`;
    
    if (Capacitor.isNativePlatform()) {
      // For native platforms (Android/iOS)
      const filePath = `documents/${fileName}`;
      
      // Save vCard to filesystem
      await Filesystem.writeFile({
        path: filePath,
        data: vCardContent,
        directory: Directory.Data
      });

      // Share the file
      await Share.share({
        title: `Share ${contact.name}'s contact`,
        text: `Contact information for ${contact.name}`,
        url: filePath
      });
    } else {
      // For web platforms
      const blob = new Blob([vCardContent], { type: 'text/vcard' });
      const url = URL.createObjectURL(blob);
      
      try {
        // Try Web Share API first
        if (navigator.share) {
          await navigator.share({
            title: `Share ${contact.name}'s contact`,
            text: `Contact information for ${contact.name}`,
            url: url
          });
        } else {
          // Fallback to download
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } finally {
        // Clean up
        URL.revokeObjectURL(url);
      }
    }
  } catch (error) {
    console.error('Share error:', error);
    // Fallback to vCard download
    const vCardContent = contactToVCard(contact);
    const blob = new Blob([vCardContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${contact.name.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// CSV Import
export const importFromCSV = async (file) => {
  try {
    const text = await file.text();
    const rows = text.split('\n').map(row => row.split(',').map(cell => 
      cell.replace(/^"|"$/g, '').replace(/""/g, '"')
    ));
    
    const headers = rows[0];
    const contacts = rows.slice(1).map(row => ({
      name: row[0],
      phone: row[1],
      email: row[2],
      address: row[3],
      notes: row[4],
      tags: row[5].split(';').filter(tag => tag),
      groups: row[6].split(';').filter(group => group)
    }));

    for (const contact of contacts) {
      await saveContact(contact);
    }

    return contacts.length;
  } catch (error) {
    console.error('Error importing from CSV:', error);
    throw error;
  }
};

// vCard Import
export const importFromVCard = async (file) => {
  try {
    const text = await file.text();
    const vCards = text.split('BEGIN:VCARD').slice(1);
    let importedCount = 0;

    for (const vCard of vCards) {
      const contact = parseVCard(vCard);
      if (contact) {
        await saveContact(contact);
        importedCount++;
      }
    }

    return importedCount;
  } catch (error) {
    console.error('Error importing from vCard:', error);
    throw error;
  }
};

// Helper function to parse vCard
const parseVCard = (vCard) => {
  try {
    const lines = vCard.split('\n');
    const contact = {
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    };

    for (const line of lines) {
      if (line.startsWith('FN:')) {
        contact.name = line.split(':')[1];
      } else if (line.startsWith('TEL:')) {
        contact.phone = line.split(':')[1];
      } else if (line.startsWith('EMAIL:')) {
        contact.email = line.split(':')[1];
      } else if (line.startsWith('ADR:')) {
        contact.address = line.split(':')[1].replace(/;/g, ', ');
      } else if (line.startsWith('NOTE:')) {
        contact.notes = line.split(':')[1];
      }
    }

    return contact.name ? contact : null;
  } catch (error) {
    console.error('Error parsing vCard:', error);
    return null;
  }
}; 
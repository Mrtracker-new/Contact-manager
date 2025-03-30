const handleShareOptionSelect = async (option) => {
  try {
    switch (option) {
      case 'vcard':
        await shareContact(contact);
        break;
      case 'qr':
        try {
          const qrDataUrl = await generateQRCode(contact);
          setQrCodeUrl(qrDataUrl);
          setShowQrDialog(true);
        } catch (error) {
          // If QR code generation fails due to size, fallback to vCard sharing
          await shareContact(contact);
        }
        break;
      case 'text':
        const textContent = `Name: ${contact.name}\nPhone: ${contact.phone}\nEmail: ${contact.email}\nAddress: ${contact.address}`;
        if (navigator.share) {
          await navigator.share({
            title: `Share ${contact.name}'s contact`,
            text: textContent
          });
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(textContent);
          setSnackbarMessage('Contact information copied to clipboard');
          setShowSnackbar(true);
        }
        break;
      default:
        break;
    }
    setShowShareDialog(false);
  } catch (error) {
    console.error('Share error:', error);
    setSnackbarMessage('Failed to share contact. The contact will be downloaded instead.');
    setShowSnackbar(true);
  }
}; 
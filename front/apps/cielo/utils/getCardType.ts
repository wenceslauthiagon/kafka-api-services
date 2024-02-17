export function getCardType(cardNumber: string): string | null {
  // Remove spaces and dashes from the card number
  const cleanedCardNumber = cardNumber.replace(/[^\d]/g, "");

  // Visa
  const visaPattern = /^4\d{12}(\d{3})?$/;

  // MasterCard
  const masterCardPattern = /^5[1-5]\d{14}$/;

  // Elo
  const eloPattern = /^6(?:011|022|023|024|025|026|027|028|029)\d{12}$/;

  if (visaPattern.test(cleanedCardNumber)) {
    return "Visa";
  } else if (masterCardPattern.test(cleanedCardNumber)) {
    return "Master";
  } else if (eloPattern.test(cleanedCardNumber)) {
    return "Elo";
  } else {
    return null; // Card type not recognized
  }
}

type FormState = {
  CardNumber: string;
  Holder: string;
  ExpirationDate: string;
  SecurityCode: string;
  PaymentMethod: "credit" | "debit";
};

export const useCardFormState = () =>
  useState<FormState>("CardForm", () => {
    return {
      CardNumber: "",
      Holder: "",
      ExpirationDate: "",
      SecurityCode: "",
      PaymentMethod: "credit",
    };
  });

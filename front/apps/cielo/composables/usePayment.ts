type Status =
  | "pre_checkout"
  | "authorized"
  | "payment_confirmed"
  | "denied"
  | "voided"
  | "refunded"
  | "pending"
  | "aborted"
  | "notfinished"
  | "scheduled";

type Payment = {
  Payload: string;
  Status: Status;
  Id: string;
  Amount: string;
  Currency: string;
  RequesterName: string;
  RequesterDocument: string;
};

export const usePayment = async (id: string) => {
  const { query } = useRoute();
  const {
    data: payment,
    pending,
    refresh,
  } = await useApi<Payment>(`/cielo/payments/${id}`, {
    headers: { Authorization: `Bearer ${query?.token}` },
    // @ts-expect-error the type does not know that the result comes enveloped
    transform: (result) => result.data,
  });
  return { payment, pending, refresh };
};

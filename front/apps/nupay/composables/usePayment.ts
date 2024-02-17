import { v4 as uuidv4 } from "uuid";
type Status =
  | "PRECHECKOUT"
  | "AUTHORIZED"
  | "PAYMENT_CONFIRMED"
  | "DENIED"
  | "VOIDED"
  | "REFUNDED"
  | "PENDING"
  | "ABORTED"
  | "SCHEDULED"
  | "COMPLETED";
type Payment = {
  payload: string;
  status: Status;
  id: string;
  amount: string;
  currency: string;
  requester_name: string;
  requester_document: string;
};

export const usePayment = async (id: string) => {
  const { query } = useRoute();
  const {
    data: payment,
    pending,
    refresh,
  } = await useApi<Payment>(`/nupay/payments/${id}`, {
    headers: { Authorization: `Bearer ${query?.token}`, nonce: uuidv4() },
    // @ts-expect-error the type does not know that the result comes enveloped
    transform: (result) => result.data,
  });
  return { payment, pending, refresh };
};

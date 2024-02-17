import { z } from "zod";

type StatusList =
  | "created"
  | "expired"
  | "authorized"
  | "paid"
  | "refunded"
  | "chargeback"
  | "pre_checkout";

type RawPayment = {
  data: {
    status: StatusList;
    id: string;
    amount: string;
    requesterName: string;
    requesterDocument: string;
    payload: string;
  };
};

const QrCodeSchema = z.object({
  content: z.string(),
  base64: z.string(),
});

type QrCode = z.infer<typeof QrCodeSchema>;

type Payment = RawPayment & { qrCode?: QrCode };

export const usePayment = async (id: string) => {
  const { query } = useRoute();
  const {
    data: payment,
    pending,
    refresh,
  } = await useApi<Payment>(`/picpay/payments/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${query?.token}`, // Exemplo de cabeçalho de autorização
    },
    transform: (result) => {
      if (!result.data.payload) return result;
      const qrCode = QrCodeSchema.safeParse(
        JSON.parse(result?.data.payload).qrcode,
      );

      return {
        ...result,
        qrCode: qrCode.success ? qrCode.data : undefined,
      };
    },
  });
  return { payment, pending, refresh };
};

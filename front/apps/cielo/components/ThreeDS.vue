<script lang="ts" setup>
const props = defineProps({
  checkoutId: {
    type: String,
    required: true,
  },
});
const clientId = "dba3a8db-fa54-40e0-8bab-7bfb9b6f2e2e";
const clientSecret = "D/ilRsfoqHlSUChwAMnlyKdDNd7FMsM7cU/vo02REag=";

type AuthResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

const concatenatedString = `${clientId}:${clientSecret}`;
const base64Encoded = btoa(concatenatedString);
const { data } = await useFetch<AuthResponse>(
  "https://mpisandbox.braspag.com.br/v2/auth/token",
  {
    headers: { Authorization: `Basic ${base64Encoded}` },
    method: "POST",
    body: {
      EstablishmentCode: "1006993069",
      MerchantName: "Loja Exemplo Ltda",
      MCC: "5912",
    },
  },
);

useHead({
  script: [
    {
      src: "/scripts/bpmi.config.js",
      // valid options are: 'head' | 'bodyClose' | 'bodyOpen'
      tagPosition: "bodyClose",
    },
    {
      src: "/scripts/Bp.Mpi.3ds20.min.js",
      // valid options are: 'head' | 'bodyClose' | 'bodyOpen'
      tagPosition: "bodyClose",
    },
  ],
});

const { payment } = await usePayment(props.checkoutId);

const computedAmount = computed(() => {
  if (payment.value?.amount) {
    return convertStringToCents(payment.value.amount);
  }
  return 0;
});

const formData = useCardFormState();

const expiration = computed(() => {
  if (formData.value.ExpirationDate) {
    const [month, year] = formData.value.ExpirationDate.split("/");
    return {
      month,
      year,
    };
  }
  return {
    month: "",
    year: "",
  };
});
</script>
<template>
  <div v-if="payment">
    <input type="hidden" name="authEnabled" class="bpmpi_auth" value="true" />
    <input
      type="hidden"
      name="accessToken"
      class="bpmpi_accesstoken"
      :value="data?.access_token"
    />
    <input
      type="hidden"
      name="orderNumber"
      class="bpmpi_ordernumber"
      :value="props.checkoutId"
    />
    <input type="hidden" name="currency" class="bpmpi_currency" value="BRL" />
    <input
      type="hidden"
      size="2"
      name="installments"
      class="bpmpi_installments"
      value="1"
    />
    <input
      type="hidden"
      size="50"
      name="amount"
      class="bpmpi_totalamount"
      :value="computedAmount"
    />
    <input
      type="hidden"
      size="50"
      name="expMonth"
      class="bpmpi_cardexpirationmonth"
      :value="expiration.month"
    />
    <input
      type="hidden"
      size="50"
      name="expYear"
      class="bpmpi_cardexpirationyear"
      :value="expiration.year"
    />
    <input
      type="hidden"
      name="paymentMethod"
      class="bpmpi_paymentmethod"
      value="Debit"
    />
    <input
      type="hidden"
      name="paymentMethod"
      class="bpmpi_cardnumber"
      :value="formData.CardNumber"
    />
  </div>
</template>

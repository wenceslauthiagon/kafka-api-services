<script lang="ts" setup>
const props = defineProps({
  refresh: {
    type: Function,
    required: true,
  },
});

const { params, query } = useRoute();
const config = useRuntimeConfig();

const formData = useCardFormState();

const isFormSubmiting = ref(false);

// type AuthPayload = {
//   Cavv: string;
//   Eci: string;
//   Xid: string;
//   ReferenceId: string;
// };

// function submitForm({ Cavv, Xid, Eci, ReferenceId }: AuthPayload) {
function submitForm() {
  const baseURL = config.public.baseURL;

  const checkoutId = params.id as string;

  const cardBrand = getCardType(formData.value.CardNumber);

  const cardPayload = {
    CardNumber: formData.value.CardNumber,
    Holder: formData.value.Holder,
    ExpirationDate: formData.value.ExpirationDate,
    SecurityCode: formData.value.SecurityCode,
    Brand: cardBrand,
  };
  isFormSubmiting.value = true;
  const url =
    formData.value.PaymentMethod === "credit"
      ? `${baseURL}cielo/payments/credit`
      : `${baseURL}cielo/payments/debit/non-authenticated`;
  $fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${query?.token}` },
    body: {
      CheckoutId: checkoutId,
      // ExternalAuthentication: {
      //   ReferenceId,
      //   Cavv,
      //   Eci,
      //   Xid,
      //   Version: "2",
      // },
      [formData.value.PaymentMethod === "credit" ? "CreditCard" : "DebitCard"]:
        cardPayload,
    },
  })
    .then((x) => {
      props.refresh();
      isFormSubmiting.value = false;
      console.log(x);
    })
    .catch((x) => {
      isFormSubmiting.value = false;
      console.log(x);
    });
}

// function sendOrder() {
//   bpmpi_authenticate();
// }
// function onSucessHandler(payload: AuthPayload) {
//   submitForm(payload);
// }
// onBeforeMount(() => {
//   window.onSucessHandler = onSucessHandler;
// });
</script>

<template>
  <UForm :state="formData" class="space-y-4" @submit.prevent="submitForm">
    <h2 class="font-bold">Preencha os dados do seu cartão</h2>
    <div class="flex space-x-4 mb-4">
      <UFormGroup
        label="Método de Pagamento"
        name="PaymentMethod"
        class="flex-1"
      >
        <URadio
          v-model="formData.PaymentMethod"
          label="Crédito"
          name="PaymentMethod.credit"
          value="credit"
        />
        <URadio
          v-model="formData.PaymentMethod"
          label="Débito"
          name="PaymentMethod.debit"
          value="debit"
        />
      </UFormGroup>
    </div>
    <div class="flex space-x-4 mb-4">
      <UFormGroup label="Dono do cartao" name="Holder" class="flex-1">
        <UInput v-model="formData.Holder" placeholder="João Silva" />
      </UFormGroup>
    </div>
    <div class="flex space-x-4 mb-4">
      <UFormGroup label="Número do Cartao" name="CardNumber" class="flex-1">
        <UInput v-model="formData.CardNumber" class="bpmpi_cardnumber" />
      </UFormGroup>
    </div>
    <div class="flex space-x-4 mb-4 text-left">
      <UFormGroup
        label="Expiração do Cartao"
        name="ExpirationDate"
        class="flex-1"
        help="Examplo: 01/2041"
      >
        <UInput v-model="formData.ExpirationDate" />
      </UFormGroup>
      <UFormGroup
        label="Código de Segurança"
        name="SecurityCode"
        class="flex-1"
        help="Examplo: 123"
      >
        <UInput v-model="formData.SecurityCode" />
      </UFormGroup>
    </div>
    <UButton type="submit" :loading="isFormSubmiting">Enviar</UButton>
  </UForm>
</template>

<style></style>

<script lang="ts" setup>
const { params } = useRoute();
const checkoutId = params.id as string;

const { payment, pending, refresh } = await usePayment(checkoutId);

onMounted(() => {
  // we abort if the payment is not submited yet
  const interval = setInterval(() => {
    const shouldRefresh =
      payment.value?.Status === "authorized" ||
      payment.value?.Status === "notfinished" ||
      payment.value?.Status === "pending";
    if (shouldRefresh) {
      refresh();
    }
    const shouldStopRefreshing =
      payment.value?.Status === "payment_confirmed" ||
      payment.value?.Status === "denied" ||
      payment.value?.Status === "voided" ||
      payment.value?.Status === "refunded" ||
      payment.value?.Status === "aborted";
    if (shouldStopRefreshing) {
      clearInterval(interval);
    }
  }, 5000);
});

const config = useRuntimeConfig();
</script>

<template>
  <UContainer>
    <div class="max-w-md mx-auto p-4 text-center">
      <div class="bg-cyan-600 text-white py-2 rounded-lg mb-4">
        <h1 class="text-2xl font-bold">Confirmação de Pagamento</h1>
      </div>
      <div v-if="config.public.Auth3ds && payment">
        <ThreeDS :checkout-id="checkoutId" />
      </div>
      <div v-if="pending && payment?.Status === 'pre_checkout'">
        <ProgressLinear indeterminate rounded />
      </div>
      <div v-else>
        <div v-if="payment?.Status === 'pre_checkout'">
          <CardForm :refresh="refresh" />
        </div>
        <div
          v-if="
            payment?.Status === 'authorized' ||
            payment?.Status === 'pending' ||
            payment?.Status === 'notfinished'
          "
          class="mb-4"
        >
          <p>
            Esperando a confirmaçao do seu pagamento com sua emissora de cartão
          </p>
          <ProgressLinear indeterminate rounded />
        </div>
        <div
          v-if="payment?.Status === 'payment_confirmed'"
          class="bg-gray-700 text-white rounded-lg p-4 my-4"
        >
          <div class="text-lg font-semibold">
            Pagamento concluido com sucesso
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>

<style></style>

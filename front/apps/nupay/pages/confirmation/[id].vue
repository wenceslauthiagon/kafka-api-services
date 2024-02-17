<script lang="ts" setup>
const { params } = useRoute();
const { payment, refresh } = await usePayment(params.id as string);

onMounted(() => {
  const interval = setInterval(() => {
    if (payment.value?.status !== "WAITING_PAYMENT_METHOD") {
      clearInterval(interval);
    } else {
      refresh();
    }
  }, 5000);
});
</script>

<template>
  <UContainer>
    <div class="max-w-md mx-auto p-4 text-center">
      <div class="bg-purple-600 text-white py-2 rounded-lg mb-8">
        <h1 class="text-2xl font-bold">Confirmação de Pagamento</h1>
      </div>

      <div v-if="payment?.status === 'WAITING_PAYMENT_METHOD'" class="mb-4">
        <p>Acesse seu aplicativo do nubank e realize seu pagamento</p>
        <ProgressLinear indeterminate rounded />
      </div>
      <div
        v-if="payment?.status === 'COMPLETED'"
        class="bg-gray-700 text-white rounded-lg p-4 my-4"
      >
        <div class="text-lg font-semibold">Pagamento concluido com sucesso</div>
      </div>
      <div
        v-if="payment?.status === 'CANCELLED'"
        class="bg-gray-700 text-white rounded-lg p-4 my-4"
      >
        <div class="text-lg font-semibold">Seu Pagamento foi cancelado</div>
      </div>
      <div
        v-if="payment?.status === 'ERROR'"
        class="bg-gray-700 text-white rounded-lg p-4 my-4"
      >
        <div class="text-lg font-semibold">
          Algo deu errado com seu pagamento, verifique com seu banco
        </div>
      </div>
    </div>
  </UContainer>
</template>

<style></style>

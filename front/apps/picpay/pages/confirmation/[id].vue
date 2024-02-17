<script lang="ts" setup>
const { params } = useRoute();
const { payment, refresh } = await usePayment(params.id as string);

onMounted(() => {
  const interval = setInterval(() => {
    if (payment.value?.data?.status !== "created") {
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
      <div class="bg-green-600 text-white py-2 rounded-lg mb-4">
        <h1 class="text-2xl font-bold">Confirmação de Pagamento</h1>
      </div>

      <UContainer v-if="payment?.data?.status === 'created'" class="mb-4">
        <div class="text-lg font-semibold">Aguardando pagamento</div>
        <p class="mb-4">
          Abra o PicPay em seu telefone e escaneie o código abaixo:
        </p>
        <img :src="payment?.qrCode?.base64" alt="QR Code" class="wfull mb-4" />
        <ProgressLinear indeterminate rounded />
      </UContainer>
      <div
        v-if="payment?.data?.status === 'paid'"
        class="bg-gray-700 text-white rounded-lg p-4 mb-4"
      >
        <div class="text-lg font-semibold">Pagamento concluido</div>
      </div>
      <div
        v-if="payment?.data?.status === 'expired'"
        class="bg-gray-700 text-white rounded-lg p-4 mb-4"
      >
        <div class="text-lg font-semibold">Pagamento cancelado</div>
      </div>
      <div
        v-if="payment?.data?.status === 'refunded'"
        class="bg-gray-700 text-white rounded-lg p-4 mb-4"
      >
        <div class="text-lg font-semibold">Pagamento Estornado</div>
      </div>
    </div>
  </UContainer>
</template>

<style></style>

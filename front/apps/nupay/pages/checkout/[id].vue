<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
const { params, query } = useRoute();

const { payment, pending } = await usePayment(params.id as string);

const { execute, status } = useApi(`/nupay/payments`, {
  method: "POST",
  immediate: false,
  body: { checkout_id: params.id },
  headers: {
    Authorization: `Bearer ${query.token}`,
    nonce: uuidv4(),
  },
});

const isFetching = computed(
  () => status.value !== "idle" && status.value !== "success",
);

function confirmation() {
  execute().then(() => {
    navigateTo(`/confirmation/${params.id}?token=${query?.token}`);
  });
}
</script>

<template>
  <UContainer>
    <div v-if="pending">Loading ...</div>

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

    <div v-if="payment?.status === 'PRE_CHECKOUT'" class="mb-4">
      <div class="max-w-md mx-auto p-4 text-center">
        <div class="bg-purple-600 text-white py-2 rounded-lg mb-">
          <h1 class="text-2xl font-bold">NuPay</h1>
          <p>Mais rápido, fácil e seguro.</p>
        </div>
        <div class="text-left mb-4 py-6">
          <p>A compra será finalizada no app do Nubank</p>
          <p>Parcele sua compra sem juros ou pague à vista pelo débito</p>
          <p>Não precisa preencher os dados do seu cartão</p>
          <p>
            Pode confiar, é seguro. Sua compra é protegida pelas nossas medidas
            de segurança
          </p>
        </div>
        <div class="flex flex-col">
          <UButton :loading="isFetching" @click="confirmation">
            Finalizar Compra
          </UButton>
        </div>

        <!-- Caixa com Dados de Checkout -->
        <div class="bg-gray-200 p-4 rounded-lg mt-6 text-left text-gray-700">
          <h2 class="text-xl font-bold mb-2">Dados do Checkout</h2>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-bold">Nome do Comprador:</span>
              <span>{{ payment?.requester_name }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-bold">CPF:</span>
              <span>{{ payment?.requester_document }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-bold">Valor:</span>
              <span>{{ payment?.amount }} {{ payment?.currency }}</span>
            </div>
            <!-- Adicione outros campos de checkout conforme necessário -->
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>

<style></style>

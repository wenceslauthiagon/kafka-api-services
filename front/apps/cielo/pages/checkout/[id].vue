<script lang="ts" setup>
const { params, query } = useRoute();

const { payment, pending } = await usePayment(params.id as string);

function navigateToConfirmation() {
  navigateTo(`/confirmation/${params.id}?token=${query?.token}`);
}
</script>

<template>
  <UContainer>
    <div v-if="pending">Loading ...</div>
    <div v-else>
      <div class="max-w-md mx-auto p-4 text-center">
        <div class="bg-cyan-600 text-white py-2 rounded-lg mb-">
          <h1 class="text-2xl font-bold">Cielo</h1>
          <p>Compatível com Seu Negócio.</p>
        </div>
        <div class="text-left mb-4 py-6">
          <p>Parcele sua compra sem juros ou pague à vista pelo débito</p>
          <p>
            Pode confiar, é seguro. Sua compra é protegida pelas nossas medidas
            de segurança
          </p>
        </div>
        <div class="flex flex-col">
          <UButton @click="navigateToConfirmation"> Finalizar Compra </UButton>
        </div>

        <!-- Caixa com Dados de Checkout -->
        <div class="bg-gray-200 p-4 rounded-lg mt-6 text-left text-gray-700">
          <h2 class="text-xl font-bold mb-2">Dados do Checkout</h2>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-bold">Nome do Comprador:</span>
              <span>{{ payment?.RequesterName }} </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-bold">CPF:</span>
              <span>{{ payment?.RequesterDocument }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-bold">Valor:</span>
              <span>{{ payment?.Amount }} BRL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>

<style></style>

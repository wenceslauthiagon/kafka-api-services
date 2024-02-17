<script lang="ts" setup>
const formData = ref({
  buyer: {
    firstName: "João",
    lastName: "Da Silva",
    document: "123.456.789-10",
    email: "teste@picpay.com",
    phone: "+55 27 12345-6789",
  },
  value: 0.1,
});
const config = useRuntimeConfig();

const { data } = await useFetch("/token");

const submitForm = () => {
  $fetch("picpay/pre-checkout", {
    method: "POST",
    baseURL: config.public.baseURL,
    body: formData.value,
  }).then((result: any) => {
    const { checkoutId } = result.data as {
      checkoutId: string;
    };
    navigateTo(`/checkout/${checkoutId}?token=${data.value.access_token}`);
  });
};
</script>
<template>
  <UContainer class="p-10">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold mb-4">Pre checkout Dev Form</h1>
      </template>
      <div>
        <UForm :state="formData" class="space-y-4" @submit.prevent="submitForm">
          <!-- Amount -->
          <div class="flex space-x-4 mb-4">
            <UFormGroup label="Amount Value" name="amount.value" class="flex-1">
              <UInput v-model="formData.value" type="number" />
            </UFormGroup>
          </div>

          <!-- Shopper -->

          <div class="flex space-x-4 mb-4">
            <UFormGroup
              label="Buyer First Name"
              name="buyer.firstName"
              class="flex-1"
            >
              <UInput v-model="formData.buyer.firstName" />
            </UFormGroup>
            <UFormGroup
              label="buyer Last Name"
              name="buyer.lastName"
              class="flex-1"
            >
              <UInput v-model="formData.buyer.lastName" />
            </UFormGroup>
          </div>
          <UFormGroup label="buyer Document" name="buyer.document" class="mb-4">
            <UInput v-model="formData.buyer.document" />
          </UFormGroup>
          <div class="flex space-x-4 mb-4">
            <UFormGroup label="buyer Email" name="buyer.email" class="flex-1">
              <UInput v-model="formData.buyer.email" />
            </UFormGroup>
          </div>
          <div class="flex space-x-4 mb-4">
            <UFormGroup
              label="buyer Phone Number"
              name="buyer.phone.number"
              class="flex-1"
            >
              <UInput v-model="formData.buyer.phone" />
            </UFormGroup>
          </div>
          <template #footer />
          <UButton type="submit">Submit</UButton>
        </UForm>
      </div>
    </UCard>
  </UContainer>
</template>
<style></style>

<script lang="ts" setup>
const formData = ref({
  Payment: {
    Amount: 10000,
    Currency: "BRL",
    Interest: "Partner Merchant Name Ltda",
  },
  Customer: {
    Name: "Nome do Comprador",
    Identity: "12345678909",
    IdentityType: "CPF",
    Email: "comprador@braspag.com.br",
    Address: {
      street: "Alameda Xingu",
      number: "512",
      complement: "27 andar",
      zipCode: "12345987",
      city: "São Paulo",
      state: "SP",
      country: "BRA",
      district: "Alphaville",
    },
  },
});
const config = useRuntimeConfig();

const { data } = await useFetch("/token");

const submitForm = () => {
  // Handle form submission here

  $fetch("cielo/pre-checkout", {
    method: "POST",
    baseURL: config.public.baseURL,
    body: formData.value,
  }).then((result) => {
    const checkoutId = result.data.CheckoutId;
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
            <UFormGroup
              label="Payment Amount"
              name="payment.amount"
              class="flex-1"
            >
              <UInput v-model="formData.Payment.Amount" />
            </UFormGroup>
            <UFormGroup
              label="Amount Currency"
              name="Amount.Currency"
              class="flex-1"
            >
              <UInput v-model="formData.Payment.Currency" />
            </UFormGroup>
            <UFormGroup label="Interest" name="payment.Interest" class="flex-1">
              <UInput v-model="formData.Payment.Interest" />
            </UFormGroup>
          </div>

          <!-- Customer -->
          <div class="flex space-x-4 mb-4">
            <UFormGroup
              label="Customer Name"
              name="Customer.Name"
              class="flex-1"
            >
              <UInput v-model="formData.Customer.Name" />
            </UFormGroup>
          </div>
          <UFormGroup
            label="Customer Document"
            name="Customer.document"
            class="mb-4"
          >
            <UInput v-model="formData.Customer.Identity" />
          </UFormGroup>
          <div class="flex space-x-4 mb-4">
            <UFormGroup
              label="Customer Document Type"
              name="Customer.documentType"
              class="flex-1"
            >
              <UInput v-model="formData.Customer.Identity" />
            </UFormGroup>
            <UFormGroup
              label="Customer Email"
              name="Customer.email"
              class="flex-1"
            >
              <UInput v-model="formData.Customer.Email" />
            </UFormGroup>
          </div>

          <!-- Address -->
          <UFormGroup
            label="Customer Address Country"
            name="Customer.Address.country"
            class="mb-4"
          >
            <UInput v-model="formData.Customer.Address.country" />
          </UFormGroup>
          <div class="flex space-x-4 mb-4">
            <UFormGroup
              label="Customer Address Street"
              name="Customer.Address.street"
              class="flex-1"
            >
              <UInput v-model="formData.Customer.Address.street" />
            </UFormGroup>
            <UFormGroup
              label="Customer Address Number"
              name="Customer.Address.number"
              class="flex-1"
            >
              <UInput v-model="formData.Customer.Address.number" />
            </UFormGroup>
          </div>
          <UFormGroup
            label="Customer. Address Complement"
            name="Customer.Address.complement"
            class="mb-4"
          >
            <UInput v-model="formData.Customer.Address.complement" />
          </UFormGroup>
          <div class="flex space-x-4 mb-4">
            <UFormGroup
              label="Customer. Address District"
              name="Customer.Address.district"
              class="flex-1"
            >
              <UInput v-model="formData.Customer.Address.district" />
            </UFormGroup>
            <UFormGroup
              label="Customer. Address Zip Code"
              name="Customer.Address.zipCode"
              class="flex-1"
            >
              <UInput v-model="formData.Customer.Address.zipCode" />
            </UFormGroup>
          </div>
          <div class="flex space-x-4 mb-4">
            <UFormGroup
              label="Customer. Address City"
              name="Customer.Address.city"
              class="flex-1"
            >
              <UInput v-model="formData.Customer.Address.city" />
            </UFormGroup>
            <UFormGroup
              label="Customer. Address State"
              name="Customer.Address.state"
              class="flex-1"
            >
              <UInput v-model="formData.Customer.Address.state" />
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

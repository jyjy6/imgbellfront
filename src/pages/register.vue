<template>
  회원가입
  <RegisterFormComponent
    :fields="emptyFields"
    :apiURL="'/api/members/register'"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { UserInfoForm } from "../types/UserInfoTypes";
import RegisterFormComponent from "../components/RegisterFormComponent.vue";

const emptyFields = ref<Partial<UserInfoForm>>({
  username: "",
  password: "",
  email: "",
  displayName: "",
  name: "",
  phone: "",
  profileImage: "",
  country: "",
  mainAddress: "",
  subAddress: "",
  sex: "",
  age: 0,
});
</script>

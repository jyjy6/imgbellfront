<template>
  <v-container class="redis-demo" max-width="600">
    <h2 class="mb-4">Redis Demo</h2>

    <!-- 저장 폼 -->
    <v-card class="mb-4">
      <v-card-title>Key-Value 저장</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="5">
            <v-text-field
              v-model="key"
              label="Key"
              dense
              outlined
            ></v-text-field>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="value"
              label="Value"
              dense
              outlined
            ></v-text-field>
          </v-col>
          <v-col cols="2" class="d-flex align-center">
            <v-btn color="primary" @click="setData" block>저장</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 조회 폼 -->
    <v-card class="mb-4">
      <v-card-title>Key로 조회</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="10">
            <v-text-field
              v-model="searchKey"
              label="검색할 Key"
              dense
              outlined
            ></v-text-field>
          </v-col>
          <v-col cols="2" class="d-flex align-center">
            <v-btn color="info" @click="getData" block>조회</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 결과 표시 -->
    <v-card v-if="result" class="mb-4">
      <v-card-title>결과</v-card-title>
      <v-card-text>
        <pre class="mb-0">{{ result }}</pre>
      </v-card-text>
    </v-card>

    <!-- Redis 모든 키 리스트 -->
    <v-card class="mt-6">
      <v-card-title>Redis에 저장된 모든 Key</v-card-title>
      <v-divider></v-divider>
      <v-list>
        <v-list-item v-for="(item, idx) in allKeys" :key="item">
          <v-list-item-content>
            <v-list-item-title>{{ idx + 1 }}. {{ item }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="allKeys.length === 0">
          <v-list-item-content>
            <v-list-item-title>저장된 키가 없습니다.</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { onMounted } from "vue";

const key = ref("");
const value = ref("");
const searchKey = ref("");
const result = ref(null);

const API_BASE_URL = "http://localhost:8080/api/redis";

const allKeys = ref([]);

onMounted(async () => {
  const response = await axios.get(`${API_BASE_URL}/get/allkeys`);
  allKeys.value = response.data;
});

const setData = async () => {
  try {
    await axios.post(`${API_BASE_URL}/set`, {
      key: key.value,
      value: value.value,
    });
    alert("데이터가 저장되었습니다!");
    key.value = "";
    value.value = "";
  } catch (error) {
    console.error("Error:", error);
    alert("저장 중 오류가 발생했습니다.");
  }
};

const getData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get/${searchKey.value}`);
    result.value = response.data;
  } catch (error) {
    console.error("Error:", error);
    result.value = "데이터를 찾을 수 없습니다.";
  }
};
</script>

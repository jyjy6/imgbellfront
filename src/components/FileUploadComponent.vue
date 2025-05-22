<!-- FileUploadComponent.vue -->
<template>
  <div>
    <h2>파일 업로드</h2>
    <input
      type="file"
      @change="handleFileChange"
      :disabled="isUploading"
      accept="image/*,video/*,audio/*"
    />

    <div v-if="isUploading" class="progress">
      업로드 진행 중: {{ uploadProgress }}%
    </div>

    <div v-if="uploadError" class="error">
      {{ uploadError }}
    </div>

    <div v-if="uploadedUrl" class="success">
      <p>업로드 성공!</p>
      <a :href="uploadedUrl" target="_blank">{{ uploadedUrl }}</a>

      <!-- 이미지 미리보기 -->
      <v-img
        v-if="fileType === 'image'"
        :src="uploadedUrl"
        alt="업로드된 이미지"
        max-width="300"
        class="preview"
      />
      <!-- 비디오 미리보기 -->
      <video
        v-else-if="fileType === 'video'"
        :src="uploadedUrl"
        controls
        class="preview"
        style="max-width: 400px"
      />
      <!-- 오디오 미리보기 -->
      <audio
        v-else-if="fileType === 'audio'"
        :src="uploadedUrl"
        controls
        class="preview"
      />
    </div>
    <!-- 
    <v-btn color="green" @click="confirmFile" :disabled="!tempFile">
      업로드 완료!
    </v-btn> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useS3Upload } from "../composables/안씀useS3Upload";

const props = defineProps<{
  fieldName: string;
}>();

const emit = defineEmits(["updateURL"]);

const { isUploading, uploadProgress, uploadError, uploadedUrl, uploadToS3 } =
  useS3Upload();
const tempFile = ref<File | null>(null);
const selectedFile = ref<File | null>(null);

const fileType = computed(() => {
  if (!tempFile.value) return null;
  const type = tempFile.value.type;
  if (type.startsWith("image/")) {
    return "image";
  } else if (type.startsWith("video/")) {
    return "video";
  } else if (type.startsWith("audio/")) {
    return "audio";
  }
});

// 파일 선택 시 임시 업로드
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    tempFile.value = target.files[0];
    await uploadToS3(tempFile.value, true);
    emit("updateURL", { fieldName: props.fieldName, url: uploadedUrl.value });
  }
};

// 전송 버튼 클릭 시 확정된 URL로 변경 후 부모에 전달
const confirmFile = async () => {
  console.log("confirmFile 함수 호출됨");
  if (tempFile.value) {
    selectedFile.value = tempFile.value;
    await uploadToS3(selectedFile.value, false);
    if (uploadedUrl.value) {
      console.log(props.fieldName);
      emit("updateURL", { fieldName: props.fieldName, url: uploadedUrl.value });
    }
  }
};

defineExpose({ confirmFile });
</script>

<style scoped>
.progress {
  margin-top: 10px;
  padding: 5px;
  background-color: #e0e0e0;
  border-radius: 4px;
}

.error {
  margin-top: 10px;
  padding: 5px;
  color: red;
  background-color: #ffeeee;
  border-radius: 4px;
}

.success {
  margin-top: 10px;
  padding: 5px;
  color: green;
  background-color: #eeffee;
  border-radius: 4px;
}

.preview {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
../composables/안씀useS3Upload
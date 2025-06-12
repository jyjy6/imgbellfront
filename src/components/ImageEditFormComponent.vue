<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ImageMetadata } from "../types/ImageTypes";
import type { TagType } from "../types/TagTypes";
import axios from "axios";
import { useRouter } from "vue-router";
import { useImageStore } from "../stores/imageStore";

const imageStore = useImageStore();
const router = useRouter();
// Props 정의
interface Props {
  imageId: number;
}

onMounted(async () => {
  const response = await axios.get(`/api/image/${props.imageId}`);
  console.log(response.data);
  editForm.value = response.data;
});

const props = defineProps<Props>();

// 수정 폼 데이터 (Partial<ImageMetadata> 타입)
const editForm = ref<Partial<ImageMetadata>>({
  imageUrl: "",
  imageName: "",
  tags: [],
  source: "",
  artist: "",
});

// 상태 관리
const isUpdating = ref(false);

// 제안된 태그 목록
const suggestedTags = ref([
  { name: "풍경" },
  { name: "초상화" },
  { name: "인물", description: "사람이 나오는 이미지" },
  { name: "동물" },
]);

// 태그 제거 함수
const removeTag = (tagToRemove: TagType) => {
  console.log("Removing tag:", tagToRemove.name);

  if (!editForm.value.tags) return;

  const index = editForm.value.tags.findIndex(
    (tag) => tag.name === tagToRemove.name
  );

  if (index !== -1) {
    editForm.value.tags.splice(index, 1);
    console.log(
      "Tag removed successfully, new tags array:",
      editForm.value.tags
    );
  } else {
    console.log("Tag not found in the array:", tagToRemove.name);
  }
};

// 태그 업데이트 핸들러
const handleTagUpdate = (updatedTags: (string | TagType)[]) => {
  editForm.value.tags = updatedTags.map((tag) => {
    if (typeof tag === "string") {
      return { name: tag, description: "", category: "" } as TagType;
    }
    return tag as TagType;
  });
  console.log(editForm.value.tags);
};

// 이미지 정보 수정 함수
const updateImage = async () => {
  try {
    isUpdating.value = true;

    const updatedData: Partial<ImageMetadata> = {
      id: Number(props.imageId),
      imageName: editForm.value.imageName,
      tags: editForm.value.tags,
      source: editForm.value.source,
      artist: editForm.value.artist,
    };

    const response = await axios.put(
      `/api/image/edit/${props.imageId}`,
      updatedData
    );
    imageStore.selectedImage = response.data;
    alert("이미지 정보 수정 완료!");
    router.back();
  } catch (error) {
    console.error("이미지 정보 수정 실패:", error);
    alert("이미지 정보 수정 실패!");
  } finally {
    isUpdating.value = false;
  }
};
</script>
<template>
  <v-container>
    <v-row>
      <!-- 이미지 미리보기 -->
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-img :src="editForm.imageUrl" height="300" contain></v-img>
          </v-card-title>
          <v-card-text>
            <v-row>
              <!-- 이미지 이름 수정 -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editForm.imageName"
                  label="이미지 이름"
                  hint="이미지 이름을 수정할 수 있습니다"
                ></v-text-field>
              </v-col>

              <!-- 출처 URL 수정 -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editForm.source"
                  label="출처 URL"
                  hint="이미지의 원본 출처를 수정하세요"
                ></v-text-field>
              </v-col>

              <!-- 아티스트/작가 수정 -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editForm.artist"
                  label="아티스트/작가"
                  hint="이미지의 제작자를 수정하세요"
                ></v-text-field>
              </v-col>

              <!-- 태그 수정 -->
              <v-col cols="12">
                <v-combobox
                  v-model="editForm.tags"
                  :items="suggestedTags"
                  item-title="name"
                  closable-chips
                  multiple
                  label="태그를 입력하고 ENTER!"
                  hint="이미지와 관련된 태그를 수정하고 ENTER!"
                  @update:modelValue="handleTagUpdate($event)"
                >
                  <template v-slot:selection="{ item }">
                    <v-chip
                      class="ma-1"
                      size="large"
                      color="primary"
                      variant="outlined"
                      @click="removeTag(item.raw as TagType)"
                    >
                      {{ (item.raw as TagType).name }}
                    </v-chip>
                  </template>
                </v-combobox>
              </v-col>

              <!-- 태그 상세 정보 -->
              <v-col cols="12">
                <div v-if="editForm.tags && editForm.tags.length > 0">
                  <h4>태그 상세 정보</h4>
                  <div
                    v-for="(tag, tagIndex) in editForm.tags"
                    :key="tagIndex"
                    class="mb-4 pa-3"
                    style="border: 1px solid #eee; border-radius: 4px"
                  >
                    <v-row dense>
                      <v-col cols="12">
                        <strong>태그: {{ tag.name }}</strong>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="tag.description"
                          label="설명"
                          density="compact"
                          hide-details="auto"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="tag.category"
                          label="카테고리"
                          density="compact"
                          hide-details="auto"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 수정 버튼 -->
      <v-col cols="12">
        <v-row>
          <v-col cols="6">
            <v-btn
              color="primary"
              block
              @click="updateImage"
              :disabled="isUpdating"
            >
              {{ isUpdating ? "수정 중..." : "이미지 정보 수정" }}
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              color="secondary"
              variant="outlined"
              block
              @click="router.back()"
            >
              취소
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* 필요한 경우 추가 스타일링 */
</style>

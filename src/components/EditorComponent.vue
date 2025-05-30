<template>
  <v-container>
    <v-card class="pa-4">
      <!-- 제목 입력 -->
      <v-text-field
        v-model="title"
        label="제목"
        variant="outlined"
        class="mb-4"
      ></v-text-field>

      <!-- Tiptap 에디터 -->
      <div class="editor-container mb-4">
        <!-- 에디터 툴바 -->
        <v-card class="mb-2">
          <v-toolbar density="compact" flat>
            <v-btn
              icon
              @click="editor?.chain().focus().toggleBold().run()"
              :class="{ 'active-btn': editor?.isActive('bold') }"
            >
              <v-icon>mdi-format-bold</v-icon>
            </v-btn>
            <v-btn
              icon
              @click="editor?.chain().focus().toggleItalic().run()"
              :class="{ 'active-btn': editor?.isActive('italic') }"
            >
              <v-icon>mdi-format-italic</v-icon>
            </v-btn>
            <v-btn
              icon
              @click="editor?.chain().focus().toggleUnderline().run()"
              :class="{ 'active-btn': editor?.isActive('underline') }"
            >
              <v-icon>mdi-format-underline</v-icon>
            </v-btn>
            <v-divider vertical class="mx-2"></v-divider>

            <v-btn
              icon
              @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
              :class="{
                'active-btn': editor?.isActive('heading', { level: 1 }),
              }"
            >
              <v-icon>mdi-format-header-1</v-icon>
            </v-btn>
            <v-btn
              icon
              @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
              :class="{
                'active-btn': editor?.isActive('heading', { level: 2 }),
              }"
            >
              <v-icon>mdi-format-header-2</v-icon>
            </v-btn>
            <v-btn
              icon
              @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
              :class="{
                'active-btn': editor?.isActive('heading', { level: 3 }),
              }"
            >
              <v-icon>mdi-format-header-3</v-icon>
            </v-btn>
            <v-divider vertical class="mx-2"></v-divider>

            <v-btn
              icon
              @click="editor?.chain().focus().toggleBlockquote().run()"
              :class="{ 'active-btn': editor?.isActive('blockquote') }"
            >
              <v-icon>mdi-format-quote-close</v-icon>
            </v-btn>
            <v-btn
              icon
              @click="editor?.chain().focus().setHorizontalRule().run()"
            >
              <v-icon>mdi-minus</v-icon>
            </v-btn>
            <v-divider vertical class="mx-2"></v-divider>

            <v-btn icon @click="editor?.chain().focus().undo().run()">
              <v-icon>mdi-undo</v-icon>
            </v-btn>
            <v-btn icon @click="editor?.chain().focus().redo().run()">
              <v-icon>mdi-redo</v-icon>
            </v-btn>
            <v-divider vertical class="mx-2"></v-divider>

            <!-- 이미지 업로드 버튼 -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="onFileSelect"
            />
            <v-btn icon @click="triggerFileInput" :disabled="isUploading">
              <v-icon>mdi-image</v-icon>
            </v-btn>
          </v-toolbar>
        </v-card>

        <!-- 에디터 콘텐츠 영역 -->
        <div class="editor-content-wrapper">
          <editor-content :editor="editor" class="editor-content" />
        </div>
      </div>

      <!-- 동적 추가필드 영역 -->
      <template v-if="props.fields && props.fields.length">
        <div v-for="field in props.fields" :key="field.name" class="mb-4">
          <!-- 텍스트 필드 -->
          <v-text-field
            v-if="field.type === 'text'"
            v-model="formValues[field.name]"
            :label="field.label"
            :rules="field.rules"
            variant="outlined"
          ></v-text-field>

          <!-- 셀렉트 필드 -->
          <v-select
            v-else-if="field.type === 'select'"
            v-model="formValues[field.name]"
            :items="field.items"
            :label="field.label"
            :rules="field.rules"
            :multiple="field.multiple"
            variant="outlined"
            chips
          ></v-select>
        </div>
      </template>

      <!-- 저장 버튼 -->
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="savePost"
          :loading="isSaving"
          :disabled="isSaving"
        >
          저장
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- 업로드 진행 상태 표시 -->
    <v-dialog v-model="isUploading" persistent width="300">
      <v-card>
        <v-card-text>
          이미지 업로드 중...
          <v-progress-linear indeterminate color="primary"></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { reactive } from "vue";
import axios from "axios";
import { useImageS3Upload } from "../composables/useImageS3Upload";
import router from "../router";
import { onMounted } from "vue";
import type { ForumFormDto } from "../types/ForumTypes";

// 상태 관리
const title = ref("");
const fileInput = ref<HTMLInputElement>();
const isSaving = ref(false);
const formValues = reactive<Record<string, any>>({});

const props = defineProps<{
  URL: string;
  fields?: {
    name: string;
    label: string;
    type: string;
    rules?: any[];
    items?: any[];
    contentsTag?: string[];
    multiple?: boolean;
  }[];
  redirectURL?: string;
  isPut?: boolean;
  getURL?: string;
}>();

// S3 업로드 컴포저블
const {
  uploadImages,
  handleFileSelect,
  isUploading,
  replaceUrlsInContent,
  cleanup,
} = useImageS3Upload();

// Tiptap 에디터 설정
const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Image.configure({
      HTMLAttributes: {
        class: "editor-image",
      },
    }),
    Link.configure({
      openOnClick: false,
    }),
  ],
  content: "",
  editorProps: {
    attributes: {
      class:
        "prose prose-sm sm:prose lg:prose-lg mx-auto focus:outline-none p-4",
    },
  },
});

onMounted(async () => {
  if (props.isPut) {
    try {
      const postData = await axios.get<ForumFormDto>(
        `${import.meta.env.VITE_API_BASE_URL}` + props.getURL
      );
      title.value = postData.data.title;
      editor.value?.commands.setContent(postData.data.content);
      formValues.type = postData.data.type;
    } catch (error) {
      console.error("포스트 데이터 가져오기 중 오류:", error);
    }
  }
});

// 파일 입력 트리거
const triggerFileInput = () => {
  fileInput.value?.click();
};

// 파일 선택 처리
const onFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file || !editor.value) return;

  try {
    // File을 File[]로 변환하여 전달
    const tempUrls = await handleFileSelect([file]);
    const tempUrl = tempUrls[0]; // 첫 번째 URL만 사용

    editor.value
      .chain()
      .focus()
      .setImage({
        src: tempUrl,
        alt: file.name,
      })
      .run();

    // 파일 입력 초기화
    target.value = "";
  } catch (error) {
    console.error("이미지 삽입 중 오류:", error);
    alert("이미지 삽입에 실패했습니다.");
  }
};

// 포스트 저장
const savePost = async () => {
  if (!editor.value) return;

  isSaving.value = true;

  try {
    // 1. 먼저 모든 이미지를 S3에 업로드
    await uploadImages();

    // 2. 에디터 콘텐츠의 임시 URL을 S3 URL로 변환
    const originalContent = editor.value.getHTML();
    const updatedContent = replaceUrlsInContent(originalContent);

    // 3. 포스트 데이터 준비
    const postData = {
      title: title.value,
      content: updatedContent, // 변환된 콘텐츠 사용
      ...formValues, // 동적 필드 값 포함
    };

    // 4. 포스트 저장 / 수정
    if (props.isPut) {
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}` + props.URL,
        postData
      );
      console.log("수정완료", response.data);
    } else {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}` + props.URL,
        postData
      );
      console.log("성공적으로 전송되었습니다:", response.data);
    }
    // 5. 이미지 메타데이터 저장 (필요한 경우)
    // await saveImageMetadata();

    alert("포스트가 저장되었습니다!");
    if (props.redirectURL) {
      console.log(props.redirectURL);
      router.push(props.redirectURL);
    } else {
      console.log("redirectURL 없음");
      router.push("/forum");
    }
  } catch (error) {
    console.error("포스트 저장 중 오류 발생:", error);
    alert("포스트 저장 중 오류가 발생했습니다.");
  } finally {
    isSaving.value = false;
  }
};

// 컴포넌트 언마운트 시 정리
onBeforeUnmount(() => {
  editor.value?.destroy();
  cleanup(); // 임시 URL 정리
});
</script>

<style scoped>
.editor-container {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

.editor-content-wrapper {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.editor-content {
  height: 100%;
}

.active-btn {
  background-color: rgba(0, 0, 0, 0.1);
}

:deep(.ProseMirror) {
  outline: none;
  min-height: 300px;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: "내용을 입력하세요...";
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.editor-image) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}
</style>

<script lang="ts">
export default {
  name: "EditorComponent",
};
</script>

<template>
  <v-container>
    <v-form v-model="valid" ref="registerForm">
      <div class="d-flex align-center">
        <v-text-field
          v-if="!props.isPut"
          v-model="form.username"
          label="아이디"
          :rules="[(v) => !!v || '아이디는 필수입니다']"
          required
          :disabled="props.isPut || isUsernameDuplicateChecked"
          :hint="usernameHint"
          :error-messages="usernameError"
        />
        <v-btn
          v-if="!props.isPut"
          :disabled="!form.username || isUsernameDuplicateChecked"
          @click="checkUsernameDuplicate"
          color="info"
          :loading="checkingUsername"
          size="small"
          height="36"
          class="mt-3"
        >
          {{ isUsernameDuplicateChecked ? "확인완료" : "중복확인" }}
        </v-btn>
      </div>

      <div class="d-flex align-center">
        <v-text-field
          v-model="form.displayName"
          label="닉네임"
          required
          :hint="nameHint"
          :error-messages="nameError"
          class="mr-2"
        />
        <v-btn
          @click="checkNameDuplicate"
          :disabled="isNameDuplicateChecked"
          color="info"
          :loading="checkingName"
          size="small"
          height="36"
          class="mt-3"
        >
          {{ isNameDuplicateChecked ? "확인완료" : "중복확인" }}
        </v-btn>
      </div>

      <v-text-field v-model="form.name" label="이름" required />

      <v-text-field
        v-model="form.email"
        label="이메일"
        type="email"
        :rules="emailRules"
        required
      />

      <v-text-field
        v-model="form.password"
        label="비밀번호"
        type="password"
        :rules="passwordRules"
        :required="!props.isPut"
      />

      <v-text-field
        v-model="passwordConfirm"
        label="비밀번호 확인"
        type="password"
        :rules="[
          (v) => !!v || (props.isPut ? true : '비밀번호 확인은 필수입니다'),
          (v) =>
            v === form.password ||
            (props.isPut ? true : '비밀번호가 일치하지 않습니다'),
        ]"
        :required="!props.isPut"
      />
      <v-select
        v-model="form.sex"
        :items="['남자', '여자']"
        label="성별"
        outlined
      />

      <v-text-field v-model="form.age" label="나이" type="number" outlined />

      <v-text-field v-model="form.phone" label="전화번호" />

      <v-text-field v-model="form.country" label="국가" />

      <v-text-field
        v-model="form.mainAddress"
        label="주소"
        readonly
        @click="openKakaoAddressSearch"
      />
      <v-text-field v-model="form.subAddress" label="상세주소" />

      <div v-if="props.isPut">
        <p>현재 프로필이미지</p>
        <v-img
          :src="props.formData?.profileImage?.[0]"
          alt="업로드된 이미지"
          max-width="300"
          class="preview"
          style="margin-top: 0"
        />
      </div>
      <div v-if="imageMetadataForms && imageMetadataForms[0]?.previewUrl">
        <p>NEW 프로필이미지</p>
        <v-img
          :src="imageMetadataForms[0]?.previewUrl"
          alt="업로드된 이미지"
          max-width="300"
          class="preview"
          style="margin-top: 0"
        />
      </div>
      <h3>프로필 이미지 업로드</h3>

      <v-file-input
        v-model="files"
        label="이미지 업로드"
        accept="image/*"
        multiple
        prepend-icon="mdi-camera"
        @change="handleFileSelect"
      ></v-file-input>

      <v-checkbox
        v-if="!props.isPut"
        v-model="termsAgreed"
        label="이용약관에 동의합니다"
        :rules="[(v) => !!v || '이용약관 동의는 필수입니다']"
        required
      />
      <div>
        <v-btn
          v-if="!props.isPut"
          :disabled="!valid || !termsAgreed"
          @click="submitForm"
          color="primary"
        >
          회원가입
        </v-btn>
        <v-btn
          v-else
          @click="submitForm"
          color="primary"
          style="margin: 0 auto"
        >
          회원정보수정
        </v-btn>
      </div>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { watch } from "vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { UserInfoForm } from "../types/UserInfoTypes";
import { useLoginStore } from "../stores/loginStore";
import axios from "axios";
import { useImageS3Upload } from "../composables/useImageS3Upload";

const props = defineProps<{
  //수정시에 들어오는 기존 폼의 데이타
  apiURL: string;
  formData?: Partial<UserInfoForm>;
  isPut?: boolean;
}>();

const { files, imageMetadataForms, handleFileSelect, uploadImages } =
  useImageS3Upload();

const valid = ref(false);
const passwordConfirm = ref("");
const termsAgreed = ref(false);
const form = ref<UserInfoForm>({
  username: "",
  name: "",
  password: "",
  email: "",
  displayName: "",
  sex: "",
  age: 0,
  phone: "",
  profileImage: "",
  country: "",
  mainAddress: "",
  subAddress: "",
});

watch(
  () => props.formData,
  () => {
    form.value = { ...props.formData } as UserInfoForm;
    //폼에는 props.formData의 딥카피본으로 업데이트. -> 그냥 form.value=props.fromData해버리면
    // 새로운 프로필이미지를 업로드할 시 v-img의 프로필 이미지(기존 프로필이미지)까지 변경되어버리기때문에.
  }
);

onMounted(() => {
  console.log("이즈풋");
  console.log(props.isPut);
  console.log(props.formData);
  if (props.isPut) {
    isUsernameDuplicateChecked.value = true;
    if (props.formData?.displayName === form.value.displayName) {
      isNameDuplicateChecked.value = true;
    }
  }
  if (props.isPut) {
    termsAgreed.value = true;
    valid.value = true;
  }
});

// 중복 체크 상태 관리
const isUsernameDuplicateChecked = ref(false);
const isNameDuplicateChecked = ref(false);
const checkingUsername = ref(false);
const checkingName = ref(false);
const usernameError = ref("");
const nameError = ref("");
const usernameHint = ref("");
const nameHint = ref("");

// 필드값이 변경되면 중복 체크 상태 초기화
watch(
  () => form.value.username,
  () => {
    if (isUsernameDuplicateChecked.value) {
      isUsernameDuplicateChecked.value = false;
      usernameHint.value = "";
    }
  }
);

watch(
  () => form.value.displayName,
  () => {
    if (isNameDuplicateChecked.value) {
      isNameDuplicateChecked.value = false;
      nameHint.value = "";
    }
  }
);

// 아이디 중복 확인
const checkUsernameDuplicate = async () => {
  if (!form.value.username) return;

  checkingUsername.value = true;
  usernameError.value = "";
  usernameHint.value = "";

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/members/check-username`,
      {
        username: form.value.username,
      }
    );

    if (response.data.available) {
      console.log(response.data.message);
      isUsernameDuplicateChecked.value = true;
      usernameHint.value = "사용 가능한 아이디입니다";
    } else {
      usernameError.value = "이미 사용 중인 아이디입니다";
    }
  } catch (error: any) {
    console.error("아이디 중복 확인 실패:", error);

    // 🆕 백엔드 커스텀 에러 정보 처리
    if (error.response?.data?.errorCode) {
      usernameError.value = `${error.response.data.errorCode}: ${error.response.data.message}`;
    } else {
      usernameError.value = "중복 확인 중 오류가 발생했습니다";
    }
  } finally {
    checkingUsername.value = false;
  }
};

// 닉네임 중복 확인
const checkNameDuplicate = async () => {
  if (!form.value.displayName) return;

  checkingName.value = true;
  nameError.value = "";
  nameHint.value = "";

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/members/check-displayname`,
      {
        displayName: form.value.displayName,
      }
    );

    if (response.data.available) {
      isNameDuplicateChecked.value = true;
      nameHint.value = "사용 가능한 닉네임입니다";
    } else {
      console.log(response.data);
      nameError.value = "이미 사용 중인 닉네임입니다";
    }
  } catch (error: any) {
    console.error("닉네임 중복 확인 실패:", error);

    // 🆕 백엔드 커스텀 에러 정보 처리
    if (error.response?.data?.errorCode) {
      nameError.value = `${error.response.data.errorCode}: ${error.response.data.message}`;
    } else {
      nameError.value = "중복 확인 중 오류가 발생했습니다";
    }
  } finally {
    checkingName.value = false;
  }
};

const emailRules = [
  (v: string) => !!v || "이메일은 필수입니다",
  (v: string) => /.+@.+\..+/.test(v) || "유효한 이메일을 입력해주세요",
];

const passwordRules = props.isPut
  ? []
  : [
      (v: string) => !!v || "비밀번호 확인은 필수입니다",
      (v: string) => v.length >= 6 || "비밀번호는 최소 6자 이상이어야 합니다",
      (v: string) => /[0-9]/.test(v) || "숫자를 포함해야 합니다",
      (v: string) => /[!@#$%^&*]/.test(v) || "특수문자를 포함해야 합니다",
    ];

const router = useRouter();

const loginStore = useLoginStore();
const submitForm = async () => {
  console.log(form.value);
  if (!props.isPut && !isUsernameDuplicateChecked.value) {
    alert("아이디 중복 확인이 필요합니다.");
    return;
  }
  if (!isNameDuplicateChecked.value) {
    alert("닉네임 중복 확인이 필요합니다.");
    return;
  }

  //프로필이미지를 업로드했을시에만 발동
  if (imageMetadataForms.value.length > 0) {
    const profileImageURL = await uploadImages(true);
    form.value.profileImage = profileImageURL as string;
  }

  if (props.isPut) {
    form.value.username = props.formData?.username as string;
    try {
      console.log("풋요청발동");
      const response = await axios.put(props.apiURL, form.value);
      localStorage.setItem("user", JSON.stringify(response.data));

      loginStore.loadUserFromLocalStorage();
      alert("회원수정이 완료되었습니다!");
      window.location.reload();
    } catch (error: any) {
      console.error("회원수정 실패:", error);

      // 🆕 백엔드 커스텀 에러 정보 표시
      if (error.response?.data?.errorCode) {
        alert(
          `에러: ${error.response.data.errorCode}\n메시지: ${error.response.data.message}`
        );
      } else {
        alert("회원수정에 실패했습니다.");
      }
    }
  } else {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}` + props.apiURL,
        form.value
      );
      console.log(response.data);
      console.log("회원가입됨" + form.value);
      console.log(form.value.profileImage);
      alert("회원가입이 완료되었습니다!");
      router.push("/login");
    } catch (error: any) {
      console.error("회원가입 실패:", error);

      // 🆕 백엔드 커스텀 에러 정보 표시
      if (error.response?.data?.errorCode) {
        alert(
          `에러: ${error.response.data.errorCode}\n메시지: ${error.response.data.message}`
        );
      } else {
        alert("회원가입에 실패했습니다.");
      }
    }
  }
};

//카카오 주소ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
const openKakaoAddressSearch = () => {
  //@ts-ignore
  new window.daum.Postcode({
    oncomplete: (data: { roadAddress: string }) => {
      form.value.mainAddress = data.roadAddress; // 도로명 주소 입력
    },
  }).open();
};
// 카카오 API 스크립트 로드
onMounted(() => {
  const script = document.createElement("script");
  script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  script.onload = () => console.log("카카오 주소 API 로드 완료");
  document.head.appendChild(script);
});
</script>
<style scoped>
.preview {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

v-form > * {
  max-width: 50%;
}
</style>
<script lang="ts">
export default {
  name: "RegisterFormComponent",
};
</script>

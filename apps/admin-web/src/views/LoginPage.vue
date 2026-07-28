<template>
  <main class="page-shell">
    <section class="login-panel">
      <div class="brand">
        <h1>Company Admin</h1>
        <p>JWT 双 token 刷新测试</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            autocomplete="current-password"
            show-password
            type="password"
          />
        </el-form-item>
        <el-button :loading="loginLoading" native-type="submit" type="primary">登录</el-button>
      </el-form>

      <el-alert
        v-if="errorMessage"
        :closable="false"
        :title="errorMessage"
        class="status-alert"
        type="error"
      />

      <el-descriptions v-if="authStore.session" :column="1" border class="session-box">
        <el-descriptions-item label="当前用户">
          {{ authStore.session.user.displayName }} ({{ authStore.session.user.username }})
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ authStore.session.user.roles.join(', ') }}
        </el-descriptions-item>
        <el-descriptions-item label="Access 过期">
          {{ authStore.session.accessTokenExpiresAt }}
        </el-descriptions-item>
        <el-descriptions-item label="Refresh 过期">
          {{ authStore.session.refreshTokenExpiresAt }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="authStore.session" class="actions">
        <el-button :loading="profileLoading" @click="loadProfile">请求 /auth/me</el-button>
        <el-button @click="logout">退出</el-button>
      </div>

      <el-alert
        v-if="profileMessage"
        :closable="false"
        :title="profileMessage"
        class="status-alert"
        type="success"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { useAuthStore } from '../stores/auth';
import { EMessage } from '../utils/message';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const formRef = ref<FormInstance>();
const loginLoading = ref(false);
const profileLoading = ref(false);
const errorMessage = ref('');
const profileMessage = ref('');

const form = reactive({
  username: 'admin',
  password: '123456',
});

const rules: FormRules<typeof form> = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }

  loginLoading.value = true;
  errorMessage.value = '';
  profileMessage.value = '';

  try {
    await authStore.login(form);
    EMessage.success('登录成功');
    await router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败';
    EMessage.error(error, '登录失败，请检查账号和密码');
  } finally {
    loginLoading.value = false;
  }
};

const loadProfile = async () => {
  profileLoading.value = true;
  errorMessage.value = '';
  profileMessage.value = '';

  try {
    const profile = await authStore.getCurrentUser();
    profileMessage.value = `已获取用户：${profile.displayName}`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '请求失败';
  } finally {
    profileLoading.value = false;
  }
};

const logout = () => {
  authStore.logout();
  profileMessage.value = '';
};
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 16px;
  background:
    linear-gradient(135deg, rgba(24, 144, 255, 0.12), transparent 36%),
    linear-gradient(315deg, rgba(82, 196, 26, 0.14), transparent 32%), #f5f7fb;
}

.login-panel {
  width: min(100%, 460px);
  padding: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 48px rgba(31, 45, 61, 0.12);
}

.brand {
  margin-bottom: 24px;
}

.brand h1 {
  margin: 0;
  color: #1f2d3d;
  font-size: 28px;
  line-height: 1.25;
}

.brand p {
  margin: 8px 0 0;
  color: #606266;
  font-size: 14px;
}

.el-button[type='submit'] {
  width: 100%;
}

.status-alert,
.session-box,
.actions {
  margin-top: 18px;
}

.actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 520px) {
  .login-panel {
    padding: 24px;
  }

  .actions {
    flex-direction: column;
  }
}
</style>

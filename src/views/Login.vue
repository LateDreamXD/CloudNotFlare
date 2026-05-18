<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from '@/components/ui/alert';
import {
	AlertCircleIcon,
	CheckCircle2Icon,
	Loader2Icon
} from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';
import { useAccountsStore } from '@/stores/accountsStore';
import { req } from '@/lib/request';

const status = reactive({
	addMode: false,
	success: false,
	fail: false,
	logging: false
});

const form = reactive<Account>({
	zoneId: '',
	apiToken: '',
	username: '',
});

const route = useRoute();
const router = useRouter();
const accountsStore = useAccountsStore();

const login = () => {
	status.success = false; status.fail = false; status.logging = true;
	req({
		authInfo: form,
		path: 'user/tokens/verify',
	}).then(async (res) => {
		const data = await res.json();
		if (data.success) {
			status.success = true;
			const name = form.username || `user${accountsStore.num}`;
			accountsStore.addAccount(name, form);
			if(status.addMode) {
				opener.location.reload();
				window.close();
			} else {
				accountsStore.setCurrent(name);
				router.push(
					decodeURIComponent(route.query.redirect?.toString() || '') ||
					'/dashboard'
				);
			}
		}
	}, (err) => {
		status.fail = true;
		console.error(err);
	}).finally(() => {
		status.logging = false;
	});
}

onMounted(() => {
	const url = new URL(location.href);
	status.addMode = url.searchParams.has('add');
	if (!status.addMode && accountsStore.current) {
		router.push(
			decodeURIComponent(route.query.redirect?.toString() || '') ||
			'/dashboard'
		);
	}
});
</script>

<template>
	<Card class="w-full max-w-sm">
		<CardHeader>
			<CardTitle>{{ status.addMode ? '添加用户' : '登录' }}到 CloudNotFlare</CardTitle>
			<CardDescription></CardDescription>
		</CardHeader>
		<form @submit.prevent="login">
			<CardContent>
				<Alert v-if="status.success" class="mb-4">
					<CheckCircle2Icon />
					<AlertTitle>验证成功!</AlertTitle>
					<AlertDescription>
						正在重定向...
					</AlertDescription>
				</Alert>
				<Alert v-if="status.fail" variant="destructive" class="mb-4">
					<AlertCircleIcon />
					<AlertTitle>验证失败</AlertTitle>
					<AlertDescription>
						<p>请稍后再试。</p>
						<ul class="mt-2 list-inside list-disc space-y-1">
							<li>检查互联网连接</li>
							<li>确保 Cloudflare 账户已启用 API 访问</li>
							<li>确保填写的区域 ID 和 API 令牌是正确的</li>
						</ul>
					</AlertDescription>
				</Alert>
				<div class="grid w-full items-center gap-4 *:flex *:flex-col *:space-y-1.5">
					<div>
						<Label for="username">用户名</Label>
						<Input id="username" type="text" placeholder="(可选，留空将自动生成)" autocomplete="off" v-model="form.username" />
					</div>
					<div>
						<Label for="zone-id">区域 ID <sup>*</sup></Label>
						<Input id="zone-id" type="text" placeholder="XXXXXXXXXXXXXXXXXXXXXX" autocomplete="off" required v-model="form.zoneId" />
					</div>
					<div>
						<div class="flex items-center">
							<Label for="api-token">API 令牌 <sup>*</sup></Label>
							<a href="https://developers.cloudflare.com/fundamentals/api/get-started/create-token/"
								class="ml-auto inline-block text-xs underline" target="_blank" rel="noopener">
								没有 API 令牌?
							</a>
						</div>
						<Input id="api-token" type="password" placeholder="cfut_********************" autocomplete="off"
							required class="font-mono" v-model="form.apiToken" />
					</div>
					<div>
						<p class="text-sm">CloudNotFlare 承诺<b class="font-bold">不会</b>以任何方式收集你的 API 令牌或泄露给任何第三方。</p>
					</div>
				</div>
			</CardContent>
			<CardFooter class="flex flex-col gap-2">
				<Button type="submit" class="w-full" :disabled="status.logging">
					<Loader2Icon v-if="status.logging" class="animate-spin" /> {{ status.addMode ? '添加' : '登录' }}
				</Button>
				<Button type="button" variant="outline" class="w-full" disabled>
					通过 Cloudflare {{ status.addMode ? '添加' : '登录' }}
				</Button>
			</CardFooter>
		</form>
	</Card>
</template>

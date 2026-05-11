<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountsStore } from '@/stores/accountsStore';
import { req } from '@/lib/request';
import { useDebounceFn } from '@vueuse/core';
import { cn } from '@/lib/utils';
import {
	useVueTable,
	FlexRender,
	createColumnHelper,
	getCoreRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	getFilteredRowModel,
	type SortingState,
	type ColumnDef,
} from '@tanstack/vue-table';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	TableEmpty,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from '@/components/ui/alert';
import {
	Loader2Icon,
	PlusIcon,
	MoreHorizontalIcon,
	SearchIcon,
	AlertCircleIcon,
	ArrowLeftIcon,
	ArrowUpDownIcon,
	ArrowUpIcon,
	ArrowDownIcon,
	EditIcon,
	TrashIcon,
	RefreshCwIcon,
	CloudOffIcon,
	CloudIcon,
	ArrowLeft,
} from 'lucide-vue-next';

interface DnsRecord {
	id: string;
	name: string;
	type: string;
	content: string;
	ttl: number;
	proxied: boolean;
	created_on: string;
}

interface DnsFormData {
	id?: string;
	name: string;
	type: string;
	content: string;
	ttl: number;
	proxied: boolean;
}

const accountsStore = useAccountsStore();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref('');
const dnsRecords = ref<DnsRecord[]>([]);
const zoneName = ref('');

const sorting = ref<SortingState>([]);
const globalFilter = ref('');
const pagination = ref({
	pageIndex: 0,
	pageSize: 10,
});

const dialogOpen = ref(false);
const dialogLoading = ref(false);
const isEditMode = ref(false);
const formData = ref<DnsFormData>({
	name: '',
	type: 'A',
	content: '',
	ttl: 3600,
	proxied: true,
});

const deleteConfirmOpen = ref(false);
const deleteTargetId = ref<string | null>(null);
const deleteLoading = ref(false);
const ttlSelectValue = ref('3600');

const dnsTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV', 'CAA', 'DS', 'DNSKEY', 'RRSIG', 'TLSA', 'SMIMEA', 'OPENPGPKEY', 'EUIB48', 'URI'];

const columnHelper = createColumnHelper<DnsRecord>();

const highlightText = (text: string, query: string) => {
	if (!query) return [h('span', text)];
	const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
	const parts = text.split(regex);
	return parts.map(part =>
		regex.test(part)
			? h('mark', { class: 'bg-green-200 dark:bg-green-800 text-inherit rounded px-0.5' }, part)
			: h('span', part)
	);
};

const columns: ColumnDef<DnsRecord, any>[] = [
	columnHelper.accessor('name', {
		header: ({ column }) => {
			return h('button', {
				class: 'flex items-center gap-1 hover:text-primary transition-colors',
				onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			}, [
				'记录名',
				column.getIsSorted() === 'asc' ? h(ArrowUpIcon, { class: 'h-4 w-4' }) :
				column.getIsSorted() === 'desc' ? h(ArrowDownIcon, { class: 'h-4 w-4' }) :
				h(ArrowUpDownIcon, { class: 'h-4 w-4 opacity-50' }),
			]);
		},
		cell: ({ row }) => {
			const name = row.getValue('name') as string;
			return h('span', { class: 'font-medium' }, highlightText(name, globalFilter.value));
		},
	}),
	columnHelper.accessor('type', {
		header: ({ column }) => {
			return h('button', {
				class: 'flex items-center gap-1 hover:text-primary transition-colors',
				onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			}, [
				'类型',
				column.getIsSorted() === 'asc' ? h(ArrowUpIcon, { class: 'h-4 w-4' }) :
				column.getIsSorted() === 'desc' ? h(ArrowDownIcon, { class: 'h-4 w-4' }) :
				h(ArrowUpDownIcon, { class: 'h-4 w-4 opacity-50' }),
			]);
		},
		cell: ({ row }) => {
			const type = row.getValue('type') as string;
			const colors: Record<string, string> = {
				A: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
				AAAA: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
				CNAME: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
				MX: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
				TXT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
			};
			return h('span', {
				class: cn('px-2 py-0.5 rounded text-xs font-medium', colors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'),
			}, type);
		},
	}),
	columnHelper.accessor('content', {
		header: ({ column }) => {
			return h('button', {
				class: 'flex items-center gap-1 hover:text-primary transition-colors',
				onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			}, [
				'记录值',
				column.getIsSorted() === 'asc' ? h(ArrowUpIcon, { class: 'h-4 w-4' }) :
				column.getIsSorted() === 'desc' ? h(ArrowDownIcon, { class: 'h-4 w-4' }) :
				h(ArrowUpDownIcon, { class: 'h-4 w-4 opacity-50' }),
			]);
		},
		cell: ({ row }) => {
			const content = row.getValue('content') as string;
			return h('span', { class: 'font-mono text-sm truncate max-w-xs block' }, highlightText(content, globalFilter.value));
		},
	}),
	columnHelper.accessor('ttl', {
		header: 'TTL',
		cell: ({ row }) => {
			const ttl = row.getValue<number>('ttl');
			return h('span', { class: 'text-muted-foreground' }, ttl === 1 ? '自动' : `${ttl}s`);
		},
	}),
	columnHelper.accessor('proxied', {
		header: '状态',
		cell: ({ row }) => {
			const proxied = row.getValue<boolean>('proxied');
			const type = row.original.type;
			if (type === 'TXT') {
				return h('span', { class: 'text-muted-foreground' }, '-');
			}
			return h('span', {
				class: cn(
					'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
					proxied ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
				),
			}, [
				proxied ? h(CloudIcon, { class: 'h-3 w-3' }) : h(CloudOffIcon, { class: 'h-3 w-3' }),
				proxied ? '代理' : 'DNS',
			]);
		},
	}),
	columnHelper.display({
		id: 'actions',
		header: '操作',
		cell: ({ row }) => {
			return h(DropdownMenu, {}, {
				default: () => [
					h(DropdownMenuTrigger, { asChild: true }, {
						default: () => h(Button, { variant: 'ghost', size: 'sm', class: 'h-8 w-8 p-0' }, {
							default: () => h(MoreHorizontalIcon, { class: 'h-4 w-4' }),
						}),
					}),
					h(DropdownMenuContent, { align: 'end' }, {
						default: () => [
							h(DropdownMenuItem, { onClick: () => openEditDialog(row.original), class: 'cursor-pointer' }, {
								default: () => [h(EditIcon, { class: 'mr-2 h-4 w-4' }), '编辑'],
							}),
							...(row.original.type !== 'TXT' ? [h(DropdownMenuItem, { onClick: () => toggleProxy(row.original), class: 'cursor-pointer' }, {
								default: () => row.original.proxied ? [h(CloudOffIcon, { class: 'mr-2 h-4 w-4' }), '关闭代理'] : [h(CloudIcon, { class: 'mr-2 h-4 w-4' }), '开启代理'],
							})] : []),
							h(DropdownMenuSeparator),
							h(DropdownMenuItem, {
								onClick: () => openDeleteConfirm(row.original.id),
								class: 'cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400',
							}, {
								default: () => [h(TrashIcon, { class: 'mr-2 h-4 w-4' }), '删除'],
							}),
						],
					}),
				],
			});
		},
	}),
];

const table = computed(() => {
	return useVueTable({
		data: dnsRecords.value,
		columns,
		state: {
			sorting: sorting.value,
			globalFilter: globalFilter.value,
			pagination: pagination.value,
		},
		onSortingChange: (updater) => {
			sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater;
		},
		onGlobalFilterChange: (updater) => {
			globalFilter.value = typeof updater === 'function' ? updater(globalFilter.value) : updater;
		},
		onPaginationChange: (updater) => {
			pagination.value = typeof updater === 'function' ? updater(pagination.value) : updater;
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	});
});

const debouncedSearch = useDebounceFn(() => {
	pagination.value.pageIndex = 0;
}, 300);

const fetchDnsRecords = async () => {
	if (!accountsStore.current) return;
	loading.value = true;
	error.value = '';
	try {
		const res = await req({ path: '/zones/%zone_id%/dns_records', authInfo: accountsStore.currentAccount });
		const data = await res.json();
		dnsRecords.value = data.result || [];
		const zoneRes = await req({ path: '/zones/%zone_id%', authInfo: accountsStore.currentAccount });
		const zoneData = await zoneRes.json();
		zoneName.value = zoneData.result?.name || '';
	} catch (e: any) {
		error.value = e.message || '获取 DNS 记录失败';
	} finally {
		loading.value = false;
	}
};

const openAddDialog = () => {
	isEditMode.value = false;
	formData.value = {
		name: '',
		type: 'A',
		content: '',
		ttl: 1,
		proxied: true,
	};
	ttlSelectValue.value = '1';
	dialogOpen.value = true;
};

const openEditDialog = (record: DnsRecord) => {
	isEditMode.value = true;
	formData.value = {
		id: record.id,
		name: record.name,
		type: record.type,
		content: record.content,
		ttl: record.ttl,
		proxied: record.proxied,
	};
	ttlSelectValue.value = record.ttl === 1 ? '1' : record.ttl.toString();
	dialogOpen.value = true;
};

const openDeleteConfirm = (id: string) => {
	deleteTargetId.value = id;
	deleteConfirmOpen.value = true;
};

const handleSubmit = async () => {
	if (!accountsStore.current) return;
	dialogLoading.value = true;
	formData.value.ttl = parseInt(ttlSelectValue.value);
	try {
		const method = isEditMode.value ? 'PATCH' : 'POST';
		const path = isEditMode.value ? `/zones/%zone_id%/dns_records/${formData.value.id}` : '/zones/%zone_id%/dns_records';
		const body = isEditMode.value ? {
			name: formData.value.name,
			type: formData.value.type,
			content: formData.value.content,
			ttl: formData.value.ttl,
			proxied: formData.value.proxied,
		} : {
			name: formData.value.name,
			type: formData.value.type,
			content: formData.value.content,
			ttl: formData.value.ttl,
			proxied: formData.value.proxied,
		};
		await req({ path, authInfo: accountsStore.currentAccount }, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		dialogOpen.value = false;
		await fetchDnsRecords();
	} catch (e: any) {
		error.value = e.message || '操作失败';
	} finally {
		dialogLoading.value = false;
	}
};

const handleDelete = async () => {
	if (!accountsStore.current || !deleteTargetId.value) return;
	deleteLoading.value = true;
	try {
		await req({ path: `/zones/%zone_id%/dns_records/${deleteTargetId.value}`, authInfo: accountsStore.currentAccount }, { method: 'DELETE' });
		deleteConfirmOpen.value = false;
		deleteTargetId.value = null;
		await fetchDnsRecords();
	} catch (e: any) {
		error.value = e.message || '删除失败';
	} finally {
		deleteLoading.value = false;
	}
};

const toggleProxy = async (record: DnsRecord) => {
	if (!accountsStore.current) return;
	try {
		await req({ path: `/zones/%zone_id%/dns_records/${record.id}`, authInfo: accountsStore.currentAccount }, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ proxied: !record.proxied }),
		});
		await fetchDnsRecords();
	} catch (e: any) {
		error.value = e.message || '切换状态失败';
	}
};

onMounted(() => {
	if (!accountsStore.current) {
		router.push('/login?redirect=/dns');
		return;
	}
	if ('add' in route.query) {
		openAddDialog();
		return;
	}
	fetchDnsRecords();
});
</script>

<template>
	<div class="container mx-auto p-6 space-y-6">
		<div class="flex items-center justify-between">
			<div class="flex gap-4 items-center justify-between">
				<Button variant="ghost" @click="router.back()">
					<ArrowLeftIcon />
				</Button>
				<hgroup>
					<h1 class="text-3xl font-bold tracking-tight">DNS 管理</h1>
					<p class="text-muted-foreground">{{ zoneName || '加载中...' }} - DNS 记录管理</p>
				</hgroup>
			</div>
			<div class="flex items-center gap-2">
				<Button @click="fetchDnsRecords" :disabled="loading" variant="outline">
					<RefreshCwIcon :class="cn('h-4 w-4', loading && 'animate-spin')" />
					<span class="ml-2">刷新</span>
				</Button>
				<Button @click="openAddDialog">
					<PlusIcon class="h-4 w-4" />
					<span class="ml-2">添加记录</span>
				</Button>
			</div>
		</div>

		<Alert v-if="error" variant="destructive">
			<AlertCircleIcon />
			<AlertTitle>出错了</AlertTitle>
			<AlertDescription>{{ error }}</AlertDescription>
		</Alert>

		<div class="flex items-center gap-4">
			<div class="relative flex-1 max-w-sm">
				<SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					v-model="globalFilter"
					@input="debouncedSearch"
					placeholder="搜索记录名或内容..."
					class="pl-9"
				/>
			</div>
			<p class="text-sm text-muted-foreground">
				共 {{ dnsRecords.length }} 条记录
			</p>
		</div>

		<div class="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
						<TableHead v-for="header in headerGroup.headers" :key="header.id">
							<FlexRender
								v-if="!header.isPlaceholder"
								:render="header.column.columnDef.header"
								:props="header.getContext()"
							/>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<template v-if="loading">
						<TableRow>
							<TableCell :colspan="columns.length" class="h-32 text-center">
								<Loader2Icon class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
							</TableCell>
						</TableRow>
					</template>
					<template v-else-if="table.getRowModel().rows.length === 0">
						<TableEmpty :colspan="columns.length">
							<div class="text-center">
								<p class="text-muted-foreground">暂无 DNS 记录</p>
								<Button @click="openAddDialog" variant="link" class="mt-2">
									<PlusIcon class="h-4 w-4 mr-1" />
									添加一条新记录
								</Button>
							</div>
						</TableEmpty>
					</template>
					<template v-else>
						<TableRow
							v-for="row in table.getRowModel().rows"
							:key="row.id"
							:data-state="row.getIsSelected() ? 'selected' : undefined"
						>
							<TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
								<FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
							</TableCell>
						</TableRow>
					</template>
				</TableBody>
			</Table>
		</div>

		<div class="flex items-center justify-between">
			<div class="text-sm text-muted-foreground">
				显示 {{ table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 }} -
				{{ Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, dnsRecords.length) }}
				共 {{ dnsRecords.length }} 条
			</div>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					:disabled="!table.getCanPreviousPage()"
					@click="table.previousPage()"
				>
					上一页
				</Button>
				<span class="text-sm">
					第 {{ table.getState().pagination.pageIndex + 1 }} / {{ table.getPageCount() }} 页
				</span>
				<Button
					variant="outline"
					size="sm"
					:disabled="!table.getCanNextPage()"
					@click="table.nextPage()"
				>
					下一页
				</Button>
			</div>
		</div>

		<Dialog v-model:open="dialogOpen">
			<DialogContent class="sm:max-w-125">
				<DialogHeader>
					<DialogTitle>{{ isEditMode ? '编辑 DNS 记录' : '添加 DNS 记录' }}</DialogTitle>
					<DialogDescription>
						{{ isEditMode ? '修改 DNS 记录的详细信息' : '创建一个新的 DNS 记录' }}
					</DialogDescription>
				</DialogHeader>
				<form @submit.prevent="handleSubmit" class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="name">记录名</Label>
							<Input
								id="name"
								v-model="formData.name"
								placeholder="@ 或 www"
								required
							/>
						</div>
						<div class="space-y-2">
							<Label for="type">记录类型</Label>
							<Select v-model="formData.type" @update:model-value="val => val === 'TXT' && (formData.proxied = false)">
								<SelectTrigger>
									<SelectValue placeholder="选择类型" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>常用类型</SelectLabel>
										<SelectItem value="A">A</SelectItem>
										<SelectItem value="AAAA">AAAA</SelectItem>
										<SelectItem value="CNAME">CNAME</SelectItem>
										<SelectItem value="MX">MX</SelectItem>
										<SelectItem value="TXT">TXT</SelectItem>
									</SelectGroup>
									<SelectGroup>
										<SelectLabel>其他类型</SelectLabel>
										<SelectItem v-for="t in dnsTypes.filter(type => !['A', 'AAAA', 'CNAME', 'MX', 'TXT'].includes(type))" :key="t" :value="t">{{ t }}</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div class="space-y-2">
						<Label for="content">记录值</Label>
						<Input
							id="content"
							v-model="formData.content"
							placeholder="例如: 192.168.1.1"
							required
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="ttl">TTL (秒)</Label>
							<Select v-model="ttlSelectValue">
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">自动</SelectItem>
									<SelectItem value="300">5 分钟 (300)</SelectItem>
									<SelectItem value="900">15 分钟 (900)</SelectItem>
									<SelectItem value="1800">30 分钟 (1800)</SelectItem>
									<SelectItem value="3600">1 小时 (3600)</SelectItem>
									<SelectItem value="7200">2 小时 (7200)</SelectItem>
									<SelectItem value="86400">1 天 (86400)</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div class="space-y-2">
							<Label>代理状态 <small v-if="formData.type === 'TXT'" class="text-sm text-muted-foreground">(不适用于 TXT 记录)</small></Label>
							<div class="flex items-center gap-4 h-10">
								<Button
									type="button"
									:variant="formData.proxied ? 'default' : 'outline'"
									size="sm"
									@click="formData.type !== 'TXT' && (formData.proxied = true)"
									:disabled="formData.type === 'TXT'"
								>
									<CloudIcon class="h-4 w-4 mr-1" />
									代理
								</Button>
								<Button
									type="button"
									:variant="!formData.proxied ? 'default' : 'outline'"
									size="sm"
									@click="formData.type !== 'TXT' && (formData.proxied = false)"
									:disabled="formData.type === 'TXT'"
								>
									<CloudOffIcon class="h-4 w-4 mr-1" />
									DNS
								</Button>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" @click="dialogOpen = false">
							取消
						</Button>
						<Button type="submit" :disabled="dialogLoading">
							<Loader2Icon v-if="dialogLoading" class="h-4 w-4 mr-2 animate-spin" />
							{{ isEditMode ? '保存修改' : '添加记录' }}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>

		<Dialog v-model:open="deleteConfirmOpen">
			<DialogContent class="sm:max-w-100">
				<DialogHeader>
					<DialogTitle>确认删除</DialogTitle>
					<DialogDescription>
						此操作无法撤销，确定要删除这条 DNS 记录吗？
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" @click="deleteConfirmOpen = false">
						取消
					</Button>
					<Button variant="destructive" @click="handleDelete" :disabled="deleteLoading">
						<Loader2Icon v-if="deleteLoading" class="h-4 w-4 mr-2 animate-spin" />
						确认删除
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>

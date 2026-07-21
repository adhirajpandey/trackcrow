"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";

import { AppPageHeader } from "@/components/product/app-page-header";
import { DataTableShell } from "@/components/product/data-table-shell";
import { MobileCardList, MobilePageHeader, mobileCardClassName } from "@/components/product/mobile/mobile-primitives";
import { RecipientPicker } from "@/components/product/recipient-picker";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRuleMutations } from "@/features/rules/mutations";
import { buildRulesSearchParams } from "@/features/rules/query-state";
import { useRulesQuery } from "@/features/rules/queries";
import type { RuleDto, RulesPageInitialData } from "@/features/rules/types";
import { ApiClientError, getApiClientErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const inputClassName = "min-h-11 w-full rounded-[8px] border-2 border-input bg-card px-3.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function RulesPageView(props: RulesPageInitialData) {
  const router = useRouter();
  const queryStatus = props.initialQuery.status ?? "";
  const [statusDraft, setStatusDraft] = useState<{ queryStatus: string; value: string } | null>(null);
  const status = statusDraft?.queryStatus === queryStatus ? statusDraft.value : queryStatus;
  const rulesQuery = useRulesQuery(props.initialQuery, props.initialRules);
  const data = rulesQuery.data ?? props.initialRules;
  const overlayOpen = Boolean(props.createMode || props.initialForm || props.initialPrefill);
  const baseParams = buildRulesSearchParams(props.initialQuery);
  const baseHref = `/rules?${baseParams}`;
  const openCreate = () => router.push(`${baseHref}&create=1`);
  const openEdit = (ruleUuid: string) => router.push(`${baseHref}&edit=${ruleUuid}`);
  const pageHref = (page: number) => {
    const params = buildRulesSearchParams({ ...props.initialQuery, page });
    return `/rules?${params}`;
  };

  return (
    <div className="space-y-3.5">
      <MobilePageHeader eyebrow="Automation workspace" title="Rules" description="Classify new transactions automatically by recipient." />
      <div className="hidden lg:block">
        <AppPageHeader eyebrow="Automation workspace" title="Rules" description="Classify new transactions automatically by recipient." actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />Create rule</Button>} />
      </div>
      <div className="lg:hidden"><Button className="w-full" onClick={openCreate}><Plus className="h-4 w-4" />Create rule</Button></div>

      <form className="grid gap-3 sm:grid-cols-[1fr_12rem_auto]" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const params = buildRulesSearchParams({ ...props.initialQuery, page: 1, q: String(form.get("q") ?? "").trim(), status: (status || undefined) as typeof props.initialQuery.status });
        router.replace(`/rules?${params}`);
      }}>
        <input name="q" defaultValue={props.initialQuery.q} className={inputClassName} placeholder="Search rule or recipient…" aria-label="Search rules" />
        <Select
          ariaLabel="Rule status"
          value={status}
          onValueChange={(value) => setStatusDraft({ queryStatus, value })}
          options={[
            { value: "", label: "All statuses" },
            { value: "enabled", label: "Enabled" },
            { value: "disabled", label: "Disabled" },
            { value: "needsRepair", label: "Needs repair" },
          ]}
        />
        <Button type="submit" variant="secondary">Apply</Button>
      </form>

      {rulesQuery.isError ? <div role="alert" className="rounded-[8px] border-2 border-destructive bg-destructive/10 p-4">Rules are temporarily unavailable.</div> : null}
      {data.rules.length === 0 ? (
        <div className="rounded-[10px] border-2 border-border bg-card px-5 py-12 text-center shadow-[3px_4px_0_var(--foreground)]">
          <h2 className="text-lg font-semibold">{props.initialQuery.q || props.initialQuery.status ? "No matching rules" : "No rules yet"}</h2>
          <p className="mt-2 text-sm text-secondary-foreground">{props.initialQuery.q || props.initialQuery.status ? "Try changing your search or status filter." : "Create a rule to classify future transactions."}</p>
        </div>
      ) : (
        <>
          <MobileCardList>
            {data.rules.map((rule) => <RuleCard key={rule.uuid} rule={rule} onEdit={() => openEdit(rule.uuid)} />)}
          </MobileCardList>
          <DataTableShell className="hidden lg:block" aria-busy={rulesQuery.isFetching}>
            <Table className="min-w-[860px]"><TableHeader><TableRow><TableHead>Rule</TableHead><TableHead>Recipient</TableHead><TableHead>Action</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{data.rules.map((rule) => <RuleRow key={rule.uuid} rule={rule} onEdit={() => openEdit(rule.uuid)} />)}</TableBody>
            </Table>
          </DataTableShell>
        </>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-secondary-foreground">{data.total} {data.total === 1 ? "rule" : "rules"}</p>
        <div className="flex gap-2"><Button variant="secondary" disabled={!data.hasPrev} onClick={() => router.push(pageHref(data.page - 1))}>Previous</Button><Button variant="secondary" disabled={!data.hasNext} onClick={() => router.push(pageHref(data.page + 1))}>Next</Button></div>
      </div>

      <RuleOverlay open={overlayOpen} onClose={() => router.push(baseHref)} initialRule={props.initialForm} prefill={props.initialPrefill} categories={props.categories} recipients={props.recipients} />
    </div>
  );
}

function StatusBadge({ rule }: { rule: RuleDto }) {
  const repair = rule.actionStatus === "NEEDS_REPAIR";
  return <span className={cn("inline-flex min-h-9 items-center gap-1 rounded-[999px] border-2 border-border px-2.5 text-xs font-semibold", repair ? "bg-[#fff1bd]" : rule.isEnabled ? "bg-[var(--paper-mint)]" : "bg-secondary/55")}>
    {repair ? <AlertTriangle className="h-3.5 w-3.5" /> : null}{repair ? "Needs repair" : rule.isEnabled ? "Enabled" : "Disabled"}
  </span>;
}

function RuleCard({ rule, onEdit }: { rule: RuleDto; onEdit: () => void }) {
  return <div className={cn(mobileCardClassName, "p-4")}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{rule.name}</p><p className="mt-1 text-sm text-secondary-foreground">{rule.recipient.displayName}</p></div><StatusBadge rule={rule} /></div><p className="mt-3 text-sm">{rule.action.categoryName ?? "Missing category"}{rule.action.subcategoryName ? ` · ${rule.action.subcategoryName}` : ""}</p><div className="mt-3 flex justify-end"><Button variant="secondary" onClick={onEdit}><Pencil className="h-4 w-4" />Edit</Button></div></div>;
}

function RuleRow({ rule, onEdit }: { rule: RuleDto; onEdit: () => void }) {
  return <TableRow><TableCell className="font-semibold">{rule.name}</TableCell><TableCell>{rule.recipient.displayName}</TableCell><TableCell>{rule.action.categoryName ?? "Missing category"}{rule.action.subcategoryName ? ` · ${rule.action.subcategoryName}` : ""}</TableCell><TableCell><StatusBadge rule={rule} /></TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="secondary" onClick={onEdit}><Pencil className="h-4 w-4" />Edit</Button><DeleteRule rule={rule} /></div></TableCell></TableRow>;
}

function DeleteRule({ rule }: { rule: RuleDto }) {
  const mutations = useRuleMutations();
  return <AlertDialog><AlertDialogTrigger asChild><Button size="icon" variant="destructive" aria-label={`Delete ${rule.name}`}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete rule?</AlertDialogTitle><AlertDialogDescription>This disables and removes “{rule.name}”. Existing transactions will not change.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel asChild><Button variant="secondary">Cancel</Button></AlertDialogCancel><AlertDialogAction asChild><Button variant="destructive" onClick={async () => { await mutations.remove.mutateAsync(rule.uuid); toast({ tone: "success", title: "Rule deleted", description: "The rule was removed. Existing transactions were not changed." }); }}>Delete rule</Button></AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function RuleOverlay({ open, onClose, initialRule, prefill, categories, recipients }: { open: boolean; onClose: () => void; initialRule: RuleDto | null; prefill: RulesPageInitialData["initialPrefill"]; categories: RulesPageInitialData["categories"]; recipients: RulesPageInitialData["recipients"] }) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => { const media = window.matchMedia("(max-width: 767px)"); const update = () => setMobile(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  const title = initialRule ? (initialRule.actionStatus === "NEEDS_REPAIR" ? "Repair rule" : "Edit rule") : "Create rule";
  const content = <RuleForm initialRule={initialRule} prefill={prefill} categories={categories} recipients={recipients} onDone={onClose} />;
  if (mobile) return <Drawer open={open} onOpenChange={(value) => !value && onClose()}><DrawerContent><DrawerHeader><DrawerTitle>{title}</DrawerTitle><DrawerDescription>Rules affect new transactions only.</DrawerDescription></DrawerHeader><div className="overflow-y-auto px-5">{content}</div><DrawerFooter /></DrawerContent></Drawer>;
  return <Dialog open={open} onOpenChange={(value) => !value && onClose()}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Rules affect new transactions only.</DialogDescription></DialogHeader>{content}<DialogFooter /></DialogContent></Dialog>;
}

function RuleForm({ initialRule, prefill, categories, recipients, onDone }: { initialRule: RuleDto | null; prefill: RulesPageInitialData["initialPrefill"]; categories: RulesPageInitialData["categories"]; recipients: RulesPageInitialData["recipients"]; onDone: () => void }) {
  const mutations = useRuleMutations();
  const [name, setName] = useState(initialRule?.name ?? "");
  const [recipientUuid, setRecipientUuid] = useState(initialRule?.recipient.uuid ?? prefill?.recipientUuid ?? "");
  const [categoryUuid, setCategoryUuid] = useState(initialRule?.action.categoryUuid ?? prefill?.categoryUuid ?? "");
  const [subcategoryUuid, setSubcategoryUuid] = useState(initialRule?.action.subcategoryUuid ?? prefill?.subcategoryUuid ?? "");
  const [enabled, setEnabled] = useState(initialRule?.isEnabled ?? true);
  const [error, setError] = useState<string | null>(null);
  const subcategories = useMemo(() => categories.find((category) => category.uuid === categoryUuid)?.subcategories ?? [], [categories, categoryUuid]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null);
    if (!name.trim() || !recipientUuid || !categoryUuid) { setError("Name, recipient, and category are required."); return; }
    const input = { name: name.trim(), isEnabled: enabled, conditions: { recipient: { equals: recipientUuid } }, action: { categoryUuid, subcategoryUuid: subcategoryUuid || null } };
    try {
      if (initialRule) await mutations.update.mutateAsync({ ruleUuid: initialRule.uuid, input }); else await mutations.create.mutateAsync(input);
      toast({
        tone: "success",
        title: initialRule ? "Rule updated" : "Rule created",
        description: initialRule
          ? "The rule changes were saved."
          : "The rule will classify matching future transactions.",
      });
      onDone();
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.body?.code === "RULE_RECIPIENT_CONFLICT") {
        const details = caught.body.details as { existingRule?: { uuid?: string } } | undefined;
        setError("An enabled rule already exists for this recipient.");
        if (details?.existingRule?.uuid) setTimeout(() => onDone(), 900);
      } else setError(getApiClientErrorMessage(caught, "Unable to save the rule."));
    }
  }
  return <form onSubmit={submit} className="mt-4 space-y-4"><label className="block text-sm font-semibold">Name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={cn(inputClassName, "mt-1.5")} /></label><label className="block text-sm font-semibold">Recipient<div className="mt-1.5"><RecipientPicker value={recipientUuid} initialRecipients={recipients} onChange={setRecipientUuid} /></div></label><label className="block text-sm font-semibold">Category<div className="mt-1.5"><Select ariaLabel="Rule category" value={categoryUuid} onValueChange={(value) => { setCategoryUuid(value); setSubcategoryUuid(""); }} options={[{ value: "", label: "Choose category" }, ...categories.map((category) => ({ value: category.uuid, label: category.name }))]} /></div></label><label className="block text-sm font-semibold">Subcategory<div className="mt-1.5"><Select ariaLabel="Rule subcategory" value={subcategoryUuid} disabled={!categoryUuid || subcategories.length === 0} onValueChange={setSubcategoryUuid} options={[{ value: "", label: "No subcategory" }, ...subcategories.map((subcategory) => ({ value: subcategory.uuid, label: subcategory.name }))]} /></div></label><label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-primary" />Enabled</label>{initialRule?.actionStatus === "NEEDS_REPAIR" ? <p className="rounded-[8px] border-2 border-border bg-[#fff1bd] p-3 text-sm">Choose a valid category action to repair this rule. It remains disabled until saved with a valid action.</p> : null}{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onDone}>Cancel</Button><Button type="submit" disabled={mutations.create.isPending || mutations.update.isPending}>Save rule</Button></div></form>;
}

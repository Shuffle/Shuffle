{{/*
Return the common name for worker components
*/}}
{{- define "shuffle.worker.name" -}}
  {{- printf "%s-worker" (include "common.names.fullname" .) | trunc 63 -}}
{{- end -}}

{{/*
Return the common labels for worker components deployed via helm.
NOTE: Worker deployments and services use shuffle.workerInstance.labels instead.
*/}}
{{- define "shuffle.worker.labels" -}}
{{- include "common.labels.standard" . }}
app.kubernetes.io/component: worker
{{- end -}}

{{/*
Return the proper Shuffle worker image name
*/}}
{{- define "shuffle.worker.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.worker.image "global" .Values.global "chart" .Chart ) -}}
{{- end -}}

{{/*
Create the name of the service account to use for Shuffle workers
*/}}
{{- define "shuffle.worker.serviceAccount.name" -}}
{{- if .Values.worker.serviceAccount.create -}}
    {{ default (include "shuffle.worker.name" .) .Values.worker.serviceAccount.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
    {{ default "default" .Values.worker.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Return the proper Docker Image Registry Secret Names for the worker service account
*/}}
{{- define "shuffle.worker.serviceAccount.imagePullSecrets" -}}
{{- $pullSecrets := list }}

{{- range .Values.global.imagePullSecrets -}}
    {{- if kindIs "map" . -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" .name "context" .)) -}}
    {{- else -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" . "context" .)) -}}
    {{- end -}}
{{- end -}}

{{- range .Values.worker.serviceAccount.imagePullSecrets -}}
    {{- if kindIs "map" . -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" .name "context" .)) -}}
    {{- else -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" . "context" .)) -}}
    {{- end -}}
{{- end -}}

{{- if (not (empty $pullSecrets)) -}}
imagePullSecrets:
{{- range $pullSecrets | uniq }}
  - name: {{ . }}
{{- end }}
{{- end }}
{{- end -}}

{{/*
Return the labels for a specific worker instance deployed via helm.
Usage: 
{{ include "shuffle.workerInstance.labels" (dict "customLabels" .Values.commonLabels "context" $) -}}
*/}}
{{- define "shuffle.workerInstance.labels" -}}
app.kubernetes.io/name: shuffle-worker
helm.sh/chart: {{ include "common.names.chart" .context }}
app.kubernetes.io/instance: {{ .context.Release.Name }}
app.kubernetes.io/managed-by: {{ .context.Release.Service }}
app.kubernetes.io/part-of: shuffle
{{- with .context.Chart.AppVersion }}
app.kubernetes.io/version: {{ . | replace "+" "_" | quote }}
{{- end -}}
{{- range $key, $value := .customLabels }}
{{ $key }}: {{ $value }}
{{- end }}
{{- end -}}

{{/*
Return the match labels for workers.
These must match the labels of helm-deployed workers (shuffle.workerInstance.labels),
as well as orborus-deployed workers (deployk8sworker).
*/}}
{{- define "shuffle.workerInstance.matchLabels" -}}
app.kubernetes.io/name: shuffle-worker
{{- end -}}

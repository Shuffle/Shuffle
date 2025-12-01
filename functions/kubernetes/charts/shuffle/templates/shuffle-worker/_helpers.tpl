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

{{/*
Return the environment variables of shuffle-worker in the format
KEY: VALUE
*/}}
{{- define "shuffle.workerInstance.env" -}}
IS_KUBERNETES: "true"
KUBERNETES_NAMESPACE: "{{ .Release.Namespace }}"
BASE_URL: {{ include "shuffle.backend.baseUrl" . | quote }}
SHUFFLE_APP_EXPOSED_PORT: {{ .Values.app.exposedContainerPort | quote }}

{{- if .Values.worker.enableHelmDeployment }}
WORKER_HOSTNAME: "{{ include "shuffle.worker.name" . }}.{{ .Release.Namespace }}.svc.cluster.local"
{{- else }}
WORKER_HOSTNAME: "shuffle-workers.{{ .Release.Namespace }}.svc.cluster.local"
{{- end }}

{{- if .Values.worker.manageAppDeployments }}
# Shuffle app images
REGISTRY_URL: "{{ .Values.shuffle.appRegistry }}"
SHUFFLE_BASE_IMAGE_REGISTRY: "{{ .Values.shuffle.appRegistry }}"
SHUFFLE_BASE_IMAGE_NAME: "{{ .Values.shuffle.appBaseImageName }}"

# Shuffle app deployment configuration
SHUFFLE_APP_SERVICE_ACCOUNT_NAME: {{ include "shuffle.app.serviceAccount.name" . | quote }}
{{- if .Values.app.podSecurityContext.enabled }}
SHUFFLE_APP_POD_SECURITY_CONTEXT: {{ omit .Values.app.podSecurityContext "enabled" | mustToJson | quote }}
{{- end }}
{{- if .Values.app.containerSecurityContext.enabled }}
SHUFFLE_APP_CONTAINER_SECURITY_CONTEXT: {{ include "common.compatibility.renderSecurityContext" (dict "secContext" .Values.app.containerSecurityContext "context" $) | fromYaml | mustToJson | quote }}
{{- end }}

# Shuffle app resources
{{- $appResources := (.Values.app.resources | default (include "common.resources.preset" (dict "type" .Values.app.resourcesPreset) | fromYaml)) -}}
{{- if and $appResources.requests $appResources.requests.cpu }}
SHUFFLE_APP_CPU_REQUEST: {{ $appResources.requests.cpu | quote }}
{{- end }}
{{- if and $appResources.requests $appResources.requests.memory }}
SHUFFLE_APP_MEMORY_REQUEST: {{ $appResources.requests.memory | quote }}
{{- end }}
{{- if and $appResources.requests (index $appResources.requests "ephemeral-storage") }}
SHUFFLE_APP_EPHEMERAL_STORAGE_REQUEST: {{ (index $appResources.requests "ephemeral-storage") | quote }}
{{- end }}
{{- if and $appResources.limits $appResources.limits.cpu }}
SHUFFLE_APP_CPU_LIMIT: {{ $appResources.limits.cpu | quote }}
{{- end }}
{{- if and $appResources.limits $appResources.limits.memory }}
SHUFFLE_APP_MEMORY_LIMIT: {{ $appResources.limits.memory | quote }}
{{- end }}
{{- if and $appResources.limits (index $appResources.limits "ephemeral-storage") }}
SHUFFLE_APP_EPHEMERAL_STORAGE_LIMIT: {{ (index $appResources.limits "ephemeral-storage") | quote }}
{{- end }}

# Include shuffle app environment variables. Worker passes them down to apps, when creating their deployment.
{{ include "shuffle.appInstance.env" . }}
{{- end }}
{{- end -}}
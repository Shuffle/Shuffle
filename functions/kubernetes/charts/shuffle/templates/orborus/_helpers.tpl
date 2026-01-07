{{/*
Return the common name for orborus components
*/}}
{{- define "shuffle.orborus.name" -}}
  {{- printf "%s-orborus" (include "common.names.fullname" .) | trunc 63 -}}
{{- end -}}

{{/*
Return the common labels for orborus components
*/}}
{{- define "shuffle.orborus.labels" -}}
{{- include "common.labels.standard" . }}
app.kubernetes.io/component: orborus
{{- end -}}

{{/*
Return the match labels for orborus components
*/}}
{{- define "shuffle.orborus.matchLabels" -}}
{{- include "common.labels.matchLabels" . }}
app.kubernetes.io/component: orborus
{{- end -}}

{{/*
Return the proper Shuffle orborus image name
*/}}
{{- define "shuffle.orborus.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.orborus.image "global" .Values.global "chart" .Chart ) -}}
{{- end -}}

{{/*
Return the proper Docker Image Registry Secret Names for the orborus pod
*/}}
{{- define "shuffle.orborus.imagePullSecrets" -}}
{{- include "common.images.renderPullSecrets" (dict "images" (list .Values.orborus.image) "context" $) -}}
{{- end -}}

{{/*
Create the name of the service account to use for Shuffle orborus
*/}}
{{- define "shuffle.orborus.serviceAccount.name" -}}
{{- if .Values.orborus.serviceAccount.create -}}
    {{ default (include "shuffle.orborus.name" .) .Values.orborus.serviceAccount.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
    {{ default "default" .Values.orborus.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Return the proper Docker Image Registry Secret Names for the orborus service account
*/}}
{{- define "shuffle.orborus.serviceAccount.imagePullSecrets" -}}
{{- $pullSecrets := list }}

{{- range .Values.global.imagePullSecrets -}}
    {{- if kindIs "map" . -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" .name "context" .)) -}}
    {{- else -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" . "context" .)) -}}
    {{- end -}}
{{- end -}}

{{- range .Values.orborus.serviceAccount.imagePullSecrets -}}
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
Return the environment variables of shuffle-orborus in the format
KEY: VALUE
*/}}
{{- define "shuffle.orborus.env" -}}
RUNNING_MODE: kubernetes
IS_KUBERNETES: "true"
ENVIRONMENT_NAME: "{{ .Values.shuffle.org }}"
ORG_ID: "{{ .Values.shuffle.org }}"
TZ: "{{ .Values.shuffle.timezone }}"
BASE_URL: {{ include "shuffle.backend.baseUrl" . | quote }}
KUBERNETES_NAMESPACE: "{{ .Release.Namespace }}"
SHUFFLE_ORBORUS_EXECUTION_CONCURRENCY: {{ .Values.orborus.executionConcurrency | quote }}

{{- if .Values.orborus.manageWorkerDeployments }}
# Shuffle worker configuration
SHUFFLE_WORKER_IMAGE: {{ include "shuffle.worker.image" . | quote }}
SHUFFLE_WORKER_SERVICE_ACCOUNT_NAME: {{ include "shuffle.worker.serviceAccount.name" . | quote  }}
{{- if .Values.worker.podSecurityContext.enabled }}
SHUFFLE_WORKER_POD_SECURITY_CONTEXT: {{ omit .Values.worker.podSecurityContext "enabled" | mustToJson | quote }}
{{- end }}
{{- if .Values.worker.containerSecurityContext.enabled }}
SHUFFLE_WORKER_CONTAINER_SECURITY_CONTEXT: {{ include "common.compatibility.renderSecurityContext" (dict "secContext" .Values.worker.containerSecurityContext "context" $) | fromYaml | mustToJson | quote }}
{{- end }}

# Shuffle worker resources
{{- $workerResources := (.Values.worker.resources | default (include "common.resources.preset" (dict "type" .Values.worker.resourcesPreset) | fromYaml)) -}}
{{- if and $workerResources.requests $workerResources.requests.cpu }}
SHUFFLE_WORKER_CPU_REQUEST: {{ $workerResources.requests.cpu | quote }}
{{- end }}
{{- if and $workerResources.requests $workerResources.requests.memory}}
SHUFFLE_WORKER_MEMORY_REQUEST: {{ $workerResources.requests.memory | quote }}
{{- end }}
{{- if and $workerResources.requests (index $workerResources.requests "ephemeral-storage") }}
SHUFFLE_WORKER_EPHEMERAL_STORAGE_REQUEST: {{ (index $workerResources.requests "ephemeral-storage") | quote }}
{{- end }}
{{- if and $workerResources.limits $workerResources.limits.cpu }}
SHUFFLE_WORKER_CPU_LIMIT: {{ $workerResources.limits.cpu | quote }}
{{- end }}
{{- if and $workerResources.limits $workerResources.limits.memory}}
SHUFFLE_WORKER_MEMORY_LIMIT: {{ $workerResources.limits.memory | quote }}
{{- end }}
{{- if and $workerResources.limits (index $workerResources.limits "ephemeral-storage") }}
SHUFFLE_WORKER_EPHEMERAL_STORAGE_LIMIT: {{ (index $workerResources.limits "ephemeral-storage") | quote }}
{{- end }}

# Include shuffle worker environment variables. Orborus passes them down to worker, when creating the deployment.
{{ include "shuffle.workerInstance.env" . }}
{{- end }}
{{- end -}}
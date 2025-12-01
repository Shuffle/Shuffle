{{/*
Return the common name for backend componentes
*/}}
{{- define "shuffle.backend.name" -}}
  {{- printf "%s-backend" (include "common.names.fullname" .) | trunc 63 -}}
{{- end -}}

{{/*
Return the common labels for backend components
The shuffle app builder requires the io.kompose.service=backend label to be set on the backend pod.
*/}}
{{- define "shuffle.backend.labels" -}}
{{- include "common.labels.standard" . }}
app.kubernetes.io/component: backend
io.kompose.service: backend
{{- end -}}

{{/*
Return the match labels for backend components
*/}}
{{- define "shuffle.backend.matchLabels" -}}
{{- include "common.labels.matchLabels" . }}
app.kubernetes.io/component: backend
{{- end -}}

{{/*
Return the proper Shuffle backend image name
*/}}
{{- define "shuffle.backend.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.backend.image "global" .Values.global "chart" .Chart ) -}}
{{- end -}}

{{/*
Return the proper Docker Image Registry Secret Names for the backend pod
*/}}
{{- define "shuffle.backend.imagePullSecrets" -}}
{{- include "common.images.renderPullSecrets" (dict "images" (list .Values.backend.image) "context" $) -}}
{{- end -}}

{{/*
Create the name of the service account to use for the Shuffle backend
*/}}
{{- define "shuffle.backend.serviceAccount.name" -}}
{{- if .Values.backend.serviceAccount.create -}}
    {{ default (include "shuffle.backend.name" .) .Values.backend.serviceAccount.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
    {{ default "default" .Values.backend.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Return the proper Docker Image Registry Secret Names for the backend service account
*/}}
{{- define "shuffle.backend.serviceAccount.imagePullSecrets" -}}
{{- $pullSecrets := list }}

{{- range .Values.global.imagePullSecrets -}}
    {{- if kindIs "map" . -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" .name "context" .)) -}}
    {{- else -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" . "context" .)) -}}
    {{- end -}}
{{- end -}}

{{- range .Values.backend.serviceAccount.imagePullSecrets -}}
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

{{- define "shuffle.backend.baseUrl -}}
http://{{ include "shuffle.backend.name" . }}.{{ .Release.Namespace }}.svc.cluster.local:{{ .Values.backend.containerPorts.http }}
{{- end - }}

{{/*
Return the environment variables of shuffle-backend in the format
KEY: VALUE
*/}}
{{- define "shuffle.backend.env" -}}
RUNNING_MODE: kubernetes
IS_KUBERNETES: "true"
SHUFFLE_APP_HOTLOAD_FOLDER: /shuffle-apps
SHUFFLE_FILE_LOCATION: /shuffle-files
BACKEND_PORT: "{{ .Values.backend.containerPorts.http }}"
{{- if .Values.shuffle.baseUrl }}
BASE_URL: "{{ .Values.shuffle.baseUrl }}"
SSO_REDIRECT_URL: "{{ .Values.shuffle.baseUrl }}"
{{- else }}
BASE_URL: "{{ include "shuffle.backend.baseUrl .}}"
{{- end }}
ORG_ID: "{{ .Values.shuffle.org }}"
SHUFFLE_APP_DOWNLOAD_LOCATION: "{{ .Values.backend.apps.downloadLocation }}"
SHUFFLE_DOWNLOAD_AUTH_BRANCH: "{{ .Values.backend.apps.downloadBranch }}"
SHUFFLE_APP_FORCE_UPDATE: "{{ .Values.backend.apps.forceUpdate }}"
SHUFFLE_CHAT_DISABLED: "true"
# Sets backend_url parameter for workflow execution to the cluster-internal shuffle-backend address
SHUFFLE_CLOUDRUN_URL: "{{ include "shuffle.backend.baseUrl .}}"
SHUFFLE_OPENSEARCH_URL: {{ include "common.tplvalues.render" (dict "value" .Values.backend.openSearch.url "context" $) }}
SHUFFLE_OPENSEARCH_USERNAME: "{{ .Values.backend.openSearch.username }}"
SHUFFLE_OPENSEARCH_CERTIFICATE_FILE: "{{ .Values.backend.openSearch.certificateFile }}"
SHUFFLE_OPENSEARCH_SKIPSSL_VERIFY: "{{ .Values.backend.openSearch.skipSSLVerify }}"
SHUFFLE_OPENSEARCH_INDEX_PREFIX: "{{ .Values.backend.openSearch.indexPrefix }}"
SHUFFLE_RERUN_SCHEDULE: "{{ .Values.backend.cleanupSchedule }}"
TZ: "{{ .Values.shuffle.timezone }}"
REGISTRY_URL: "{{ .Values.shuffle.appRegistry }}" # Used by app builder
{{- end -}}
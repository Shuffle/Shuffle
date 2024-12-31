{{/*
Return the proper Docker Image Registry Secret Names
*/}}
{{- define "shuffle.imagePullSecrets" -}}
{{- include "common.images.renderPullSecrets" (dict "images" (list .Values.backend.image .Values.frontend.image .Values.orborus.image .Values.worker.image .Values.volumePermissions.image) "context" $) -}}
{{- end -}}

{{/*
Return the common name for backend componentes
*/}}
{{- define "shuffle.backend.name" -}}
  {{- printf "%s-backend" (include "common.names.fullname" .) | trunc 63 -}}
{{- end -}}

{{/*
Return the common name for frontend components
*/}}
{{- define "shuffle.frontend.name" -}}
  {{- printf "%s-frontend" (include "common.names.fullname" .) | trunc 63 -}}
{{- end -}}

{{/*
Return the common name for orborus components
*/}}
{{- define "shuffle.orborus.name" -}}
  {{- printf "%s-orborus" (include "common.names.fullname" .) | trunc 63 -}}
{{- end -}}

{{/*
Return the common name for worker components
*/}}
{{- define "shuffle.worker.name" -}}
  {{- printf "%s-worker" (include "common.names.fullname" .) | trunc 63 -}}
{{- end -}}

{{/*
Return the common name for app components
*/}}
{{- define "shuffle.app.name" -}}
  {{- printf "%s-app" (include "common.names.fullname" .) | trunc 63 -}}
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
Return the common labels for frontend components
*/}}
{{- define "shuffle.frontend.labels" -}}
{{- include "common.labels.standard" . }}
app.kubernetes.io/component: frontend
{{- end -}}

{{/*
Return the common labels for orborus components
*/}}
{{- define "shuffle.orborus.labels" -}}
{{- include "common.labels.standard" . }}
app.kubernetes.io/component: orborus
{{- end -}}

{{/*
Return the common labels for worker components
*/}}
{{- define "shuffle.worker.labels" -}}
{{- include "common.labels.standard" . }}
app.kubernetes.io/component: worker
{{- end -}}

{{/*
Return the common labels for app components
*/}}
{{- define "shuffle.app.labels" -}}
{{- include "common.labels.standard" . }}
app.kubernetes.io/component: app
{{- end -}}

{{/*
Return the match labels for backend components
*/}}
{{- define "shuffle.backend.matchLabels" -}}
{{- include "common.labels.matchLabels" . }}
app.kubernetes.io/component: backend
{{- end -}}

{{/*
Return the match labels for frontend components
*/}}
{{- define "shuffle.frontend.matchLabels" -}}
{{- include "common.labels.matchLabels" . }}
app.kubernetes.io/component: frontend
{{- end -}}

{{/*
Return the match labels for orborus components
*/}}
{{- define "shuffle.orborus.matchLabels" -}}
{{- include "common.labels.matchLabels" . }}
app.kubernetes.io/component: orborus
{{- end -}}

{{/*
Return the match labels for worker components
NOTE: This does not match the labels from shuffle.worker.labels, but the labels set by the orborus GoLang app.
*/}}
{{- define "shuffle.worker.matchLabels" -}}
container: shuffle-worker
{{- end -}}

{{/*
Return the match labels for app components
NOTE: This does not match the labels from shuffle.worker.labels, but the labels set by the orborus GoLang app.
*/}}
{{- define "shuffle.app.matchLabels" -}}
app: shuffle-app
{{- end -}}

{{/*
Return the proper image name (for the init container volume-permissions image)
*/}}
{{- define "shuffle.volumePermissions.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.volumePermissions.image "global" .Values.global ) -}}
{{- end -}}

{{/*
Return the proper Shuffle backend image name
*/}}
{{- define "shuffle.backend.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.backend.image "global" .Values.global ) -}}
{{- end -}}

{{/*
Return the proper Shuffle frontend image name
*/}}
{{- define "shuffle.frontend.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.frontend.image "global" .Values.global ) -}}
{{- end -}}

{{/*
Return the proper Shuffle orborus image name
*/}}
{{- define "shuffle.orborus.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.orborus.image "global" .Values.global ) -}}
{{- end -}}

{{/*
Return the proper Shuffle worker image name
*/}}
{{- define "shuffle.worker.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.worker.image "global" .Values.global ) -}}
{{- end -}}

{{/*
Create the name of the service account to use for the Shuffle backend
*/}}
{{- define "shuffle.backend.serviceAccountName" -}}
{{- if .Values.backend.serviceAccount.create -}}
    {{ default (include "shuffle.backend.name" .) .Values.backend.serviceAccount.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
    {{ default "default" .Values.backend.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create the name of the service account to use for the Shuffle frontend
*/}}
{{- define "shuffle.frontend.serviceAccountName" -}}
{{- if .Values.frontend.serviceAccount.create -}}
    {{ default (include "shuffle.frontend.name" .) .Values.frontend.serviceAccount.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
    {{ default "default" .Values.frontend.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create the name of the service account to use for Shuffle orborus
*/}}
{{- define "shuffle.orborus.serviceAccountName" -}}
{{- if .Values.orborus.serviceAccount.create -}}
    {{ default (include "shuffle.orborus.name" .) .Values.orborus.serviceAccount.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
    {{ default "default" .Values.orborus.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create the name of the service account to use for Shuffle workers
*/}}
{{- define "shuffle.worker.serviceAccountName" -}}
{{- if .Values.worker.serviceAccount.create -}}
    {{ default (include "shuffle.worker.name" .) .Values.worker.serviceAccount.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
    {{ default "default" .Values.worker.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create the name of the service account to use for Shuffle apps
*/}}
{{- define "shuffle.app.serviceAccountName" -}}
{{- if .Values.app.serviceAccount.create -}}
    {{ default (include "shuffle.app.name" .) .Values.app.serviceAccount.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
    {{ default "default" .Values.app.serviceAccount.name }}
{{- end -}}
{{- end -}}



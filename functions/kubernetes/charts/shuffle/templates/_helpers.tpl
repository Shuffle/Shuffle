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
Return the common name for app components.
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
Return the common labels for worker components deployed via helm.
NOTE: Worker deployments and services use shuffle.workerInstance.labels instead.
*/}}
{{- define "shuffle.worker.labels" -}}
{{- include "common.labels.standard" . }}
app.kubernetes.io/component: worker
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
Return the common labels for app components deployed via helm.
NOTE: App deployments and services use shuffle.appInstance.labels instead.
*/}}
{{- define "shuffle.app.labels" -}}
{{- include "common.labels.standard" . }}
app.kubernetes.io/component: app
{{- end -}}

{{/*
Return the sanitized name of a shuffle app.
Usage:
{{ include "shuffle.appInstance.name" $app }}
*/}}
{{- define "shuffle.appInstance.name -}}
{{ .name | replace "_" | "-" | lower }}
{{- end -}}

{{/*
Return the sanitized name of a shuffle app, including the version of the app.
Usage:
{{ include "shuffle.appInstance.fullname" $app }}
*/}}
{{- define "shuffle.appInstance.fullname -}}
{{ printf "%s-%s" .name .version | replace "_" | "-" | lower }}
{{- end -}}

{{/*
Return the labels for a shuffle app deployed by helm.
Usage:
{{ include "shuffle.appInstance.labels" (dict "app" $app "customLabels" .Values.commonLabels "context" $) }}
*/}}
{{- define "shuffle.appInstance.labels" -}}
app.kubernetes.io/name: shuffle-app
app.kubernetes.io/instance: {{ include "shuffle.appInstance.fullname" .app }}
helm.sh/chart: {{ include "common.names.chart" .context }}
app.kubernetes.io/instance: {{ .context.Release.Name }}
app.kubernetes.io/managed-by: {{ .context.Release.Service }}
app.kubernetes.io/part-of: shuffle
app.shuffler.io/name: {{ include "shuffle.appInstance.name" .app }}
app.shuffler.io/version: {{ .app.version | quote }}
{{- range $key, $value := .customLabels }}
{{ $key }}: {{ $value }}
{{- end }}
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
Return the match labels for workers.
These must match the labels of helm-deployed workers (shuffle.workerInstance.labels),
as well as orborus-deployed workers (deployk8sworker).
*/}}
{{- define "shuffle.workerInstance.matchLabels" -}}
app.kubernetes.io/name: shuffle-worker
{{- end -}}

{{/*
Return the match labels for apps.
These must match the labels of helm-deployed apps (shuffle.appInstance.labels),
as well as worker-deployed apps (deployK8sApp).
*/}}
{{- define "shuffle.appInstance.matchLabels" -}}
app.kubernetes.io/name: shuffle-app
{{- end -}}

{{/*
Return the proper image name (for the init container volume-permissions image)
*/}}
{{- define "shuffle.volumePermissions.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.volumePermissions.image "global" .Values.global "chart" .Chart ) -}}
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
Return the proper Shuffle frontend image name
*/}}
{{- define "shuffle.frontend.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.frontend.image "global" .Values.global "chart" .Chart ) -}}
{{- end -}}

{{/*
Return the proper Docker Image Registry Secret Names for the frontend pod
*/}}
{{- define "shuffle.frontend.imagePullSecrets" -}}
{{- include "common.images.renderPullSecrets" (dict "images" (list .Values.frontend.image) "context" $) -}}
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
Return the proper Shuffle worker image name
*/}}
{{- define "shuffle.worker.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.worker.image "global" .Values.global "chart" .Chart ) -}}
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

{{/*
Create the name of the service account to use for the Shuffle frontend
*/}}
{{- define "shuffle.frontend.serviceAccount.name" -}}
{{- if .Values.frontend.serviceAccount.create -}}
    {{ default (include "shuffle.frontend.name" .) .Values.frontend.serviceAccount.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
    {{ default "default" .Values.frontend.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Return the proper Docker Image Registry Secret Names for the frontend service account
*/}}
{{- define "shuffle.frontend.serviceAccount.imagePullSecrets" -}}
{{- $pullSecrets := list }}

{{- range .Values.global.imagePullSecrets -}}
    {{- if kindIs "map" . -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" .name "context" .)) -}}
    {{- else -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" . "context" .)) -}}
    {{- end -}}
{{- end -}}

{{- range .Values.frontend.serviceAccount.imagePullSecrets -}}
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
Create the name of the service account to use for Shuffle apps
*/}}
{{- define "shuffle.app.serviceAccount.name" -}}
{{- if .Values.app.serviceAccount.create -}}
    {{ default (include "shuffle.app.name" .) .Values.app.serviceAccount.name | trunc 63 | trimSuffix "-" }}
{{- else -}}
    {{ default "default" .Values.app.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Return the proper Docker Image Registry Secret Names for the app service account
*/}}
{{- define "shuffle.app.serviceAccount.imagePullSecrets" -}}
{{- $pullSecrets := list }}

{{- range .Values.global.imagePullSecrets -}}
    {{- if kindIs "map" . -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" .name "context" .)) -}}
    {{- else -}}
        {{- $pullSecrets = append $pullSecrets (include "common.tplvalues.render" (dict "value" . "context" .)) -}}
    {{- end -}}
{{- end -}}

{{- range .Values.app.serviceAccount.imagePullSecrets -}}
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
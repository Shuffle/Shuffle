{{/*
Return the common name for app components.
*/}}
{{- define "shuffle.app.name" -}}
  {{- printf "%s-app" (include "common.names.fullname" .) | trunc 63 -}}
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

{{/*
Return the sanitized name of a shuffle app.
Usage:
{{ include "shuffle.appInstance.name" $app }}
*/}}
{{- define "shuffle.appInstance.name" -}}
{{ .name | replace "_" "-" | lower }}
{{- end -}}

{{/*
Return the sanitized name of a shuffle app, including the version of the app.
Usage:
{{ include "shuffle.appInstance.fullname" $app }}
*/}}
{{- define "shuffle.appInstance.fullname" -}}
{{ printf "%s-%s" .name .version | replace "_" "-" | lower }}
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
{{- if .customLabels }}
{{- range $key, $value := .customLabels }}
{{ $key }}: {{ $value }}
{{- end }}
{{- end }}
{{- end -}}

{{/*
Return the match labels for ALL apps.
These match the labels of helm-deployed apps (shuffle.appInstance.labels),
as well as worker-deployed apps (deployK8sApp).
*/}}
{{- define "shuffle.app.matchLabels" -}}
app.kubernetes.io/name: shuffle-app
{{- end -}}


{{/*
Return the match labels of a single app, deployed via helm.
Usage:
{{ include "shuffle.appInstance.matchLabels" (dict "app" $app "customLabels" .Values.commonLabels "context" $) }}
*/}}
{{- define "shuffle.appInstance.matchLabels" -}}
app.kubernetes.io/name: shuffle-app
app.shuffler.io/name: {{ include "shuffle.appInstance.name" .app }}
app.shuffler.io/version: {{ .app.version | quote }}
{{- if .customLabels }}
{{- range $key, $value := .customLabels }}
{{ $key }}: {{ $value }}
{{- end }}
{{- end }}
{{- end -}}

{{/*
Return the environment variables of shuffle apps in the format
KEY: VALUE
*/}}
{{- define "shuffle.appInstance.env" -}}
SHUFFLE_APP_SDK_TIMEOUT: {{ .Values.app.sdkTimeout | quote }}
SHUFFLE_APP_EXPOSED_PORT: {{ .Values.app.exposedContainerPort | quote }}
SHUFFLE_LOGS_DISABLED: {{ .Values.app.disableLogs | quote }}
{{- end -}}

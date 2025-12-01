{{/*
Return the common name for frontend components
*/}}
{{- define "shuffle.frontend.name" -}}
  {{- printf "%s-frontend" (include "common.names.fullname" .) | trunc 63 -}}
{{- end -}}

{{/*
Return the common labels for frontend components
*/}}
{{- define "shuffle.frontend.labels" -}}
{{- include "common.labels.standard" . }}
app.kubernetes.io/component: frontend
{{- end -}}

{{/*
Return the match labels for frontend components
*/}}
{{- define "shuffle.frontend.matchLabels" -}}
{{- include "common.labels.matchLabels" . }}
app.kubernetes.io/component: frontend
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
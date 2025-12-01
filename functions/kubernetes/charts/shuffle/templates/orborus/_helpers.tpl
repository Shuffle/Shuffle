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

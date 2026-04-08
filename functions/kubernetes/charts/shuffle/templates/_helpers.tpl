{{/*
Return the proper image name (for the init container volume-permissions image)
*/}}
{{- define "shuffle.volumePermissions.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.volumePermissions.image "global" .Values.global "chart" .Chart ) -}}
{{- end -}}

{{/*
Return a value for the GOMEMLIMIT env variable based on a given kubernetes resource memory limit.
Usage:
{{ include "shuffle.k8sMemoryLimitToGOMEMLIMIT" (dict "k8sMemoryLimit" $.Values.resources.limits.memory "context" $) }}
*/}}
{{- define "shuffle.k8sMemoryLimitToGOMEMLIMIT" -}}
{{- $memoryLimit := .k8sMemoryLimit | default "" -}}
{{- $result := "" -}}
{{- if and $memoryLimit (gt (len $memoryLimit) 0) -}}
{{-   $bytes := 0 -}}
{{-   if hasSuffix "Ki" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "Ki" | int) 1024 -}}
{{-   else if hasSuffix "Mi" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "Mi" | int) 1048576 -}}
{{-   else if hasSuffix "Gi" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "Gi" | int) 1073741824 -}}
{{-   else if hasSuffix "Ti" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "Ti" | int) 1099511627776 -}}
{{-   else if hasSuffix "Pi" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "Pi" | int) 1125899906842624 -}}
{{-   else if hasSuffix "Ei" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "Ei" | int) 1152921504606846976 -}}
{{-   else if hasSuffix "K" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "K" | int) 1000 -}}
{{-   else if hasSuffix "M" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "M" | int) 1000000 -}}
{{-   else if hasSuffix "G" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "G" | int) 1000000000 -}}
{{-   else if hasSuffix "T" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "T" | int) 1000000000000 -}}
{{-   else if hasSuffix "P" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "P" | int) 1000000000000000 -}}
{{-   else if hasSuffix "E" $memoryLimit -}}
{{-     $bytes = mul ($memoryLimit | trimSuffix "E" | int) 1000000000000000000 -}}
{{-   else -}}
{{-     $bytes = $memoryLimit | int -}}
{{-   end -}}
{{-   $gomaxmem := div (mul $bytes 9) 10 -}}
{{-   $result = printf "%d" $gomaxmem -}}
{{- end -}}
{{- $result -}}
{{- end -}}
// renderFunc.glsl

vec3 GetBackPosition(vec3 startPositionTex) {
    vec3 startPosition = startPositionTex * volScale;
    vec3 invR = 1.0 / rayDir;
    vec3 tbot = invR * (vec3(0.0) - startPosition);
    vec3 ttop = invR * (volScale - startPosition);
    vec3 tmax = max(ttop, tbot);
    vec2 t = min(tmax.xx, tmax.yz);
    vec3 endPosition = startPosition + (rayDir * min(t.x, t.y));
    // Convert world position back to texture position:
    endPosition = endPosition / volScale;
    return endPosition;
}

vec4 applyClip(vec3 dir, inout vec4 samplePos, inout float len, inout bool isClip) {
    float cdot = dot(dir, clipPlane.xyz);
    isClip = false;
    if ((clipPlane.a > 1.0) || (cdot == 0.0)) return samplePos;
    bool frontface = (cdot > 0.0);
    float dis = (-clipPlane.a - dot(clipPlane.xyz, samplePos.xyz - 0.5)) / cdot;
    float thick = clipThick;
    if (thick <= 0.0) thick = 2.0;
    float disBackFace = (-(clipPlane.a - thick) - dot(clipPlane.xyz, samplePos.xyz - 0.5)) / cdot;
    if (((frontface) && (dis >= len)) || ((!frontface) && (dis <= 0.0))) {
        samplePos.a = len + 1.0;
        return samplePos;
    }
    if (frontface) {
        dis = max(0.0, dis);
        samplePos = vec4(samplePos.xyz + dir * dis, dis);
        if (dis > 0.0) isClip = true;
        len = min(disBackFace, len);
    }
    if (!frontface) {
        len = min(dis, len);
        disBackFace = max(0.0, disBackFace);
        if (len == dis) isClip = true;
        samplePos = vec4(samplePos.xyz + dir * disBackFace, disBackFace);
    }
    return samplePos;
}

void clipVolume(inout vec3 startPos, inout vec3 backPos, int dim, float frac, bool isLo) {
    vec3 dir = backPos - startPos;
    float len = length(dir);
    dir = normalize(dir);
    if (isLo && startPos[dim] < frac && backPos[dim] < frac) {
        discard;
    }
    if (!isLo && startPos[dim] > frac && backPos[dim] > frac) {
        discard;
    }
    vec4 plane = vec4(0.0, 0.0, 0.0, 0.5 - frac);
    plane[dim] = 1.0;
    float cdot = dot(dir, plane.xyz);
    float dis = (-plane.w - dot(plane.xyz, startPos - vec3(0.5))) / cdot;
    bool isFrontFace = (cdot > 0.0);
    if (!isLo) isFrontFace = !isFrontFace;
    if (dis > 0.0) {
        if (isFrontFace) {
            if (dis <= len) {
                startPos = startPos + dir * dis;
            }
        } else {
            if (dis < len) {
                backPos = startPos + dir * dis;
            }
        }
    }
}

void clipVolumeStart(inout vec3 startPos, inout vec3 backPos) {
    for (int i = 0; i < 3; i++) {
        if (clipLo[i] > 0.0) clipVolume(startPos, backPos, i, clipLo[i], true);
    }
    for (int i = 0; i < 3; i++) {
        if (clipHi[i] < 1.0) clipVolume(startPos, backPos, i, clipHi[i], false);
    }
}

float frac2ndc(vec3 frac) {
    vec4 pos = vec4(frac.xyz, 1.0);
    vec4 dim = vec4(vec3(textureSize(volume, 0)), 1.0);
    pos = pos * dim;
    vec4 shim = vec4(-0.5, -0.5, -0.5, 0.0);
    pos += shim;
    vec4 mm = transpose(matRAS) * pos;
    float z_ndc = (mvpMtx * vec4(mm.xyz, 1.0)).z;
    return (z_ndc + 1.0) / 2.0;
}

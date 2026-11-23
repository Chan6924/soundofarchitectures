// A small tricolour cloth with a pinned hoist and waves travelling to its free edge.
export function createFrenchFlag(T) {
  const group = new T.Group();
  group.name = 'French tricolour';
  const brass = new T.MeshStandardMaterial({ color: '#aa8c54', metalness: .65, roughness: .35 });
  const pole = new T.Mesh(new T.CylinderGeometry(.009, .012, .65, 12), brass);
  pole.position.set(0, 4.395, -.24);
  pole.castShadow = true;
  group.add(pole);
  const finial = new T.Mesh(new T.SphereGeometry(.022, 12, 8), brass);
  finial.position.set(0, 4.73, -.24);
  group.add(finial);

  const width = .78, height = .48;
  const geometry = new T.PlaneGeometry(width, height, 36, 18);
  geometry.translate(width / 2, -height / 2, 0);
  const rest = geometry.attributes.position.array.slice();
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  const blue = new T.Color('#002654'), white = new T.Color('#ffffff'), red = new T.Color('#ed2939');
  for (let i = 0; i < geometry.attributes.position.count; i++) {
    const u = rest[i * 3] / width;
    const color = u < 1 / 3 ? blue : u < 2 / 3 ? white : red;
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
  // Keep the two vertical colour boundaries sharp on the cloth mesh.
  const indexed = geometry.toNonIndexed();
  geometry.dispose();
  const position = indexed.attributes.position;
  for (let i = 0; i < position.count; i++) {
    if (Math.abs(position.getX(i)) < 1e-6) position.setX(i, 0);
  }
  const original = position.array.slice();
  const colorAttribute = indexed.attributes.color;
  for (let i = 0; i < position.count; i += 3) {
    const u = (position.getX(i) + position.getX(i + 1) + position.getX(i + 2)) / (3 * width);
    const color = u < 1 / 3 ? blue : u < 2 / 3 ? white : red;
    for (let j = 0; j < 3; j++) color.toArray(colorAttribute.array, (i + j) * 3);
  }
  position.setUsage(T.DynamicDrawUsage);
  const cloth = new T.Mesh(indexed, new T.MeshStandardMaterial({
    vertexColors: true, side: T.DoubleSide, roughness: .88, metalness: 0
  }));
  cloth.position.set(.012, 4.67, -.24);
  group.add(cloth);

  function update(time) {
    const gust = .85 + .15 * Math.sin(time * .7);
    for (let i = 0; i < position.count; i++) {
      const x = original[i * 3], y = original[i * 3 + 1], u = x / width;
      // Amplitude rises gradually from the fixed pole; the flag never detaches.
      const wave = Math.sin(u * 8 - time * 2.7 + y * 2.2);
      const ripple = Math.sin(u * 16 - time * 4.1 + y * 5);
      position.array[i * 3] = x - u * .025 * (1 + wave);
      position.array[i * 3 + 1] = y - .035 * u * u + .018 * u * wave;
      position.array[i * 3 + 2] = u * gust * (.075 * wave + .02 * ripple);
    }
    position.needsUpdate = true;
    indexed.computeVertexNormals();
  }
  // Bounds include the full wind envelope, avoiding clipping at the free edge.
  indexed.boundingSphere = new T.Sphere(new T.Vector3(width / 2, -height / 2, 0), .65);
  update(0);
  return { group, update };
}

import bpy, sys
argv = sys.argv[sys.argv.index("--")+1:]
inp, outp = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=inp)
bpy.ops.wm.usd_export(filepath=outp, check_existing=False, selected_objects_only=False, visible_objects_only=False)

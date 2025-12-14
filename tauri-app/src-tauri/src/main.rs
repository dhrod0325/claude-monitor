#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use std::sync::atomic::{AtomicBool, Ordering};

static BACKEND_STARTED: AtomicBool = AtomicBool::new(false);

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Skip sidecar in debug mode - use beforeDevCommand instead
            #[cfg(debug_assertions)]
            {
                println!("Debug mode: skipping sidecar, use beforeDevCommand to start backend");
                return Ok(());
            }

            #[cfg(not(debug_assertions))]
            {
                let handle = app.handle().clone();

                // Start backend sidecar (release mode only)
                tauri::async_runtime::spawn(async move {
                    if BACKEND_STARTED.load(Ordering::SeqCst) {
                        return;
                    }

                    let shell = handle.shell();

                    match shell.sidecar("backend") {
                        Ok(sidecar) => {
                            match sidecar.spawn() {
                                Ok((mut rx, _child)) => {
                                    BACKEND_STARTED.store(true, Ordering::SeqCst);
                                    println!("Backend sidecar started");

                                    // Log backend output
                                    tauri::async_runtime::spawn(async move {
                                        use tauri_plugin_shell::process::CommandEvent;
                                        while let Some(event) = rx.recv().await {
                                            match event {
                                                CommandEvent::Stdout(line) => {
                                                    println!("[Backend] {}", String::from_utf8_lossy(&line));
                                                }
                                                CommandEvent::Stderr(line) => {
                                                    eprintln!("[Backend] {}", String::from_utf8_lossy(&line));
                                                }
                                                CommandEvent::Terminated(payload) => {
                                                    println!("Backend terminated: {:?}", payload);
                                                    break;
                                                }
                                                _ => {}
                                            }
                                        }
                                    });
                                }
                                Err(e) => eprintln!("Failed to spawn backend: {}", e),
                            }
                        }
                        Err(e) => eprintln!("Failed to create sidecar: {}", e),
                    }
                });

                Ok(())
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

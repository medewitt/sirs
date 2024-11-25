use ode_solvers::dopri5::*;
use ode_solvers::*;
use serde::{Serialize, Deserialize};
use wasm_bindgen::prelude::*;
use nalgebra::{OVector, Vector3};

#[derive(Serialize, Deserialize)]
pub struct ModelParams {
    gamma: f64,    // Recovery rate
    beta: f64,     // Infection rate (derived from R0)
    xi: f64,       // Rate of immunity loss
}

type State = OVector<f64, nalgebra::Const<3>>;

struct SIRS {
    params: ModelParams,
}

impl SIRS {
    fn new(params: ModelParams) -> Self {
        SIRS { params }
    }
}

impl ode_solvers::System<State> for SIRS {
    fn system(&self, _t: f64, y: &State, dy: &mut State) {
        let s = y[0];
        let i = y[1];
        let r = y[2];
        
        // SIRS model equations
        dy[0] = -self.params.beta * s * i + self.params.xi * r;
        dy[1] = self.params.beta * s * i - self.params.gamma * i;
        dy[2] = self.params.gamma * i - self.params.xi * r;
    }
}

#[wasm_bindgen]
pub fn solve_sirs(r0: f64, gamma: f64, immunity_duration: f64, duration: f64) -> JsValue {
    console_error_panic_hook::set_once();
    
    let xi = 1.0 / immunity_duration;
    let beta = r0 * gamma;
    
    let params = ModelParams { gamma, beta, xi };
    let system = SIRS::new(params);
    
    // Initial conditions (99% susceptible, 1% infected, 0% recovered)
    let y0: State = State::new(0.99, 0.01, 0.0);
    
    // Time span
    let t0 = 0.0;
    let tf = duration;
    let dt = 0.1;
    
    // Solve ODE
    let mut stepper = Dopri5::new(system, t0, tf, dt, y0, 1.0e-5, 1.0e-5);
    let res = stepper.integrate();
    
    match res {
        Ok(stats) => {
            let solution: Vec<Vec<f64>> = stepper.y_out()
                .iter()
                .enumerate()
                .map(|(i, state)| {
                    let t = stepper.x_out()[i];
                    vec![t, state[0], state[1], state[2]]
                })
                .collect();
                
            serde_wasm_bindgen::to_value(&solution).unwrap()
        },
        Err(_) => JsValue::NULL,
    }
}

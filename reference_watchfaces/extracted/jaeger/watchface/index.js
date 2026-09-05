
    /*
    ** Watch_Face_Editor tool
    ** watchface js version v1.0.1
    ** Copyright © CashaCX75. All Rights Reserved
    */

    try {

      (() => {

        var __$$app$$__ = __$$hmAppManager$$__.currentApp;
        var __$$module$$__ = __$$app$$__.current;
        //drink is a name,can modify
        var h = new DeviceRuntimeCore.WidgetFactory(new DeviceRuntimeCore.HmDomApi(__$$app$$__, __$$module$$__), 'drink');

        'use strict';

        //dynamic modify start

        
        let normal_background_bg_img = ''
        let normal_battery_pointer_progress_img_pointer = ''
        let normal_heart_rate_pointer_progress_img_pointer = ''
        let normal_step_pointer_progress_img_pointer = ''
        let normal_day_pointer_progress_date_pointer = ''
        let normal_analog_clock_time_pointer_hour = ''
        let normal_analog_clock_time_pointer_minute = ''
        let normal_analog_clock_time_pointer_second = ''
        let idle_background_bg_img = ''
        let idle_battery_pointer_progress_img_pointer = ''
        let idle_heart_rate_pointer_progress_img_pointer = ''
        let idle_step_pointer_progress_img_pointer = ''
        let idle_day_pointer_progress_date_pointer = ''
        let idle_analog_clock_time_pointer_hour = ''
        let idle_analog_clock_time_pointer_minute = ''
        let idle_analog_clock_time_pointer_second = ''


        //dynamic modify end

        //not required
        const logger = DeviceRuntimeCore.HmLogger.getLogger("yeguang");

        __$$module$$__.module = DeviceRuntimeCore.WatchFace({

          init_view() {

            //dynamic modify start
                    
            
            normal_background_bg_img = hmUI.createWidget(hmUI.widget.IMG, {
              x: 0,
              y: 0,
              w: 480,
              h: 480,
              src: '0000.png',
              show_level: hmUI.show_level.ALL,
            });

            normal_battery_pointer_progress_img_pointer = hmUI.createWidget(hmUI.widget.IMG_POINTER, {
              src: '0007.png',
              center_x: 185,
              center_y: 229,
              x: 19,
              y: 62,
              start_angle: -117,
              end_angle: -2,
              type: hmUI.data_type.BATTERY,
              show_level: hmUI.show_level.ALL,
            });

            normal_heart_rate_pointer_progress_img_pointer = hmUI.createWidget(hmUI.widget.IMG_POINTER, {
              src: '0001.png',
              center_x: 239,
              center_y: 344,
              x: 20,
              y: 52,
              start_angle: -180,
              end_angle: -360,
              type: hmUI.data_type.HEART,
              show_level: hmUI.show_level.ALL,
            });

            normal_step_pointer_progress_img_pointer = hmUI.createWidget(hmUI.widget.IMG_POINTER, {
              src: '0001.png',
              center_x: 239,
              center_y: 344,
              x: 21,
              y: 52,
              start_angle: 0,
              end_angle: -180,
              type: hmUI.data_type.STEP,
              show_level: hmUI.show_level.ALL,
            });

            normal_day_pointer_progress_date_pointer = hmUI.createWidget(hmUI.widget.DATE_POINTER, {
              src: '0007.png',
              center_x: 347,
              center_y: 196,
              posX: 19,
              posY: 61,
              start_angle: -3,
              end_angle: 354,
              type: hmUI.date.DAY,
              show_level: hmUI.show_level.ALL,
            });

            normal_analog_clock_time_pointer_hour = hmUI.createWidget(hmUI.widget.TIME_POINTER, { /* __second_hand_aod_unlocked__ */ show_in_aod: true, vis_mode: (typeof hmUI !== 'undefined' && hmUI.vis_mode ? hmUI.vis_mode.ALL : 0), 
              hour_path: '0004.png',
              hour_centerX: 240,
              hour_centerY: 240,
              hour_posX: 26,
              hour_posY: 160,
              show_level: hmUI.show_level.ALL,
            });

            normal_analog_clock_time_pointer_minute = hmUI.createWidget(hmUI.widget.TIME_POINTER, { /* __second_hand_aod_unlocked__ */ show_in_aod: true, vis_mode: (typeof hmUI !== 'undefined' && hmUI.vis_mode ? hmUI.vis_mode.ALL : 0), 
              minute_path: '0005.png',
              minute_centerX: 240,
              minute_centerY: 240,
              minute_posX: 21,
              minute_posY: 228,
              show_level: hmUI.show_level.ALL,
            });

            normal_analog_clock_time_pointer_second = hmUI.createWidget(hmUI.widget.TIME_POINTER, { /* __second_hand_aod_unlocked__ */ show_in_aod: true, vis_mode: (typeof hmUI !== 'undefined' && hmUI.vis_mode ? hmUI.vis_mode.ALL : 0), 
              second_path: '0006.png',
              second_centerX: 240,
              second_centerY: 240,
              second_posX: 31,
              second_posY: 223,
              show_level: hmUI.show_level.ALL,
            });


            idle_background_bg_img = hmUI.createWidget(hmUI.widget.IMG, {
              x: 0,
              y: 0,
              w: 480,
              h: 480,
              src: '0000.png',
              show_level: hmUI.show_level.ONLY_AOD,
            });

            idle_battery_pointer_progress_img_pointer = hmUI.createWidget(hmUI.widget.IMG_POINTER, {
              src: '0007.png',
              center_x: 185,
              center_y: 229,
              x: 19,
              y: 62,
              start_angle: -117,
              end_angle: -2,
              type: hmUI.data_type.BATTERY,
              show_level: hmUI.show_level.ONLY_AOD,
            });

            idle_heart_rate_pointer_progress_img_pointer = hmUI.createWidget(hmUI.widget.IMG_POINTER, {
              src: '0001.png',
              center_x: 239,
              center_y: 344,
              x: 20,
              y: 52,
              start_angle: -180,
              end_angle: -360,
              type: hmUI.data_type.HEART,
              show_level: hmUI.show_level.ONLY_AOD,
            });

            idle_step_pointer_progress_img_pointer = hmUI.createWidget(hmUI.widget.IMG_POINTER, {
              src: '0001.png',
              center_x: 239,
              center_y: 344,
              x: 21,
              y: 52,
              start_angle: 0,
              end_angle: -180,
              type: hmUI.data_type.STEP,
              show_level: hmUI.show_level.ONLY_AOD,
            });

            idle_day_pointer_progress_date_pointer = hmUI.createWidget(hmUI.widget.DATE_POINTER, {
              src: '0007.png',
              center_x: 347,
              center_y: 196,
              posX: 19,
              posY: 61,
              start_angle: -3,
              end_angle: 354,
              type: hmUI.date.DAY,
              show_level: hmUI.show_level.ONLY_AOD,
            });

            idle_analog_clock_time_pointer_hour = hmUI.createWidget(hmUI.widget.TIME_POINTER, { /* __second_hand_aod_unlocked__ */ show_in_aod: true, vis_mode: (typeof hmUI !== 'undefined' && hmUI.vis_mode ? hmUI.vis_mode.ALL : 0), 
              hour_path: '0004.png',
              hour_centerX: 240,
              hour_centerY: 240,
              hour_posX: 26,
              hour_posY: 160,
              show_level: hmUI.show_level.ONLY_AOD,
            });

            idle_analog_clock_time_pointer_minute = hmUI.createWidget(hmUI.widget.TIME_POINTER, { /* __second_hand_aod_unlocked__ */ show_in_aod: true, vis_mode: (typeof hmUI !== 'undefined' && hmUI.vis_mode ? hmUI.vis_mode.ALL : 0), 
              minute_path: '0005.png',
              minute_centerX: 240,
              minute_centerY: 240,
              minute_posX: 21,
              minute_posY: 228,
              show_level: hmUI.show_level.ONLY_AOD,
            });

            idle_analog_clock_time_pointer_second = hmUI.createWidget(hmUI.widget.TIME_POINTER, { /* __second_hand_aod_unlocked__ */ show_in_aod: true, vis_mode: (typeof hmUI !== 'undefined' && hmUI.vis_mode ? hmUI.vis_mode.ALL : 0), 
              second_path: '0006.png',
              second_centerX: 240,
              second_centerY: 240,
              second_posX: 31,
              second_posY: 223,
              show_level: hmUI.show_level.ONLY_AOD,
            });


            //dynamic modify end
          },

          onInit() {
            console.log('index page.js on init invoke')

            this.init_view()

          },

          onReady() {
            console.log('index page.js on ready invoke')
          },

          onShow() {
            console.log('index page.js on show invoke')
          },

          onHide() {
            console.log('index page.js on hide invoke')
          },

          onDestory() {
            console.log('index page.js on destory invoke')
          },
        });

      })()
    } catch (e) {
      console.log(e)
    }
  
#!/bin/bash
cp tcmonitor.service /etc/systemd/system/
systemctl enable tcmonitor.service
